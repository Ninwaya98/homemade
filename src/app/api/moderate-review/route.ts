import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { recalculateProfileScore } from "@/lib/review-utils";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const SYSTEM_PROMPT = `You are a review moderation assistant for HomeMade, a local marketplace where home cooks sell food and artisans sell handmade goods.

Your job is to analyze customer reviews and, when present, the seller/cook's response to a complaint.

For each review, output a JSON object with these fields:
- "sentiment": "positive" | "negative" | "spam" | "neutral"
- "summary": a one-line summary of the review (max 100 chars)
- "recommendation": "approve" | "reject" | "needs_human_review" (only when a response is present)
- "reasoning": a brief explanation of your assessment

Guidelines:
- A review is "spam" if it contains no useful feedback, is promotional, or is clearly fake.
- A review is "neutral" if it's neither clearly positive nor negative.
- When assessing a resolution response, check if the cook/seller genuinely acknowledged the issue and described concrete steps to fix it. Vague responses like "we'll do better" should be "needs_human_review".
- Approve resolutions that show genuine understanding and a concrete fix.
- Reject resolutions that are dismissive, blame the customer, or don't address the issue.

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.`;

export async function POST(request: Request) {
  try {
    const admin = await requireRole("admin");
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await request.json();
    if (!reviewId) {
      return NextResponse.json({ error: "Missing reviewId" }, { status: 400 });
    }

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const { data: review } = await sb
      .from("reviews")
      .select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name), reviewee:profiles!reviews_reviewee_id_fkey(full_name)")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Build the user prompt
    let userPrompt = `Review by "${review.reviewer?.full_name ?? "Customer"}" about "${review.reviewee?.full_name ?? "Seller/Cook"}":\n`;
    userPrompt += `Sentiment: ${review.sentiment}\n`;
    userPrompt += `Text: "${review.text ?? "(no text)"}"\n`;

    if (review.response_text) {
      userPrompt += `\n--- Cook/Seller Response ---\n`;
      userPrompt += `"${review.response_text}"\n`;
      userPrompt += `\nPlease classify the review AND assess whether the response should be approved.`;
    } else {
      userPrompt += `\nPlease classify this review. No response to assess.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const aiText = message.content[0].type === "text" ? message.content[0].text : "";
    let aiResult;
    try {
      aiResult = JSON.parse(aiText);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON", raw: aiText }, { status: 500 });
    }

    // Store AI results on the review
    await sb.from("reviews").update({
      ai_sentiment: aiResult.sentiment,
      ai_summary: aiResult.summary,
    }).eq("id", reviewId);

    // If AI recommends approve/reject and status is pending, auto-apply
    if (review.resolution_status === "pending" && aiResult.recommendation === "approve") {
      await sb.from("reviews").update({
        resolution_status: "approved",
        resolved_at: new Date().toISOString(),
        resolved_by: admin.id,
      }).eq("id", reviewId);

      // Recalculate score
      const { data: cookCheck } = await supabase
        .from("cook_profiles")
        .select("id")
        .eq("id", review.reviewee_id)
        .maybeSingle();
      const vertical = cookCheck ? "kitchen" : "market";
      await recalculateProfileScore(sb, review.reviewee_id, vertical);
    }

    return NextResponse.json({
      ...aiResult,
      auto_applied: review.resolution_status === "pending" && aiResult.recommendation === "approve",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
