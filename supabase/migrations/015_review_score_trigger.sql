-- Migration 015: Automatic review score recalculation via trigger
-- Replaces the JavaScript recalculateProfileScore() function with a database trigger
-- that fires after every review insert/update/delete.

CREATE OR REPLACE FUNCTION recalculate_review_score()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewee uuid;
  v_likes INT;
  v_valid_dislikes INT;
  v_resolved INT;
  v_total INT;
  v_score INT;
  v_avg NUMERIC(3,2);
BEGIN
  v_reviewee := COALESCE(NEW.reviewee_id, OLD.reviewee_id);

  -- Aggregate all customer reviews for this profile
  SELECT
    COUNT(*) FILTER (WHERE sentiment = 'like'),
    COUNT(*) FILTER (WHERE sentiment = 'dislike' AND text IS NOT NULL AND resolution_status NOT IN ('approved')),
    COUNT(*) FILTER (WHERE sentiment = 'dislike' AND resolution_status = 'approved')
  INTO v_likes, v_valid_dislikes, v_resolved
  FROM reviews
  WHERE reviewee_id = v_reviewee AND role = 'customer';

  v_total := v_likes + v_valid_dislikes;
  v_score := CASE WHEN v_total >= 10 THEN ROUND((v_likes::DECIMAL / v_total) * 100) ELSE NULL END;
  v_avg := CASE WHEN v_total > 0 THEN ROUND((v_likes::DECIMAL / v_total) * 5, 2) ELSE 0 END;

  -- Update cook_profiles if this reviewee is a cook
  UPDATE cook_profiles SET
    like_count = v_likes,
    dislike_count = v_valid_dislikes,
    resolved_count = v_resolved,
    score = v_score,
    avg_rating = v_avg,
    rating_count = v_likes + v_valid_dislikes + v_resolved
  WHERE id = v_reviewee;

  -- Update seller_profiles if this reviewee is a seller
  UPDATE seller_profiles SET
    like_count = v_likes,
    dislike_count = v_valid_dislikes,
    resolved_count = v_resolved,
    score = v_score,
    avg_rating = v_avg,
    rating_count = v_likes + v_valid_dislikes + v_resolved
  WHERE id = v_reviewee;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire after any review change
CREATE TRIGGER trg_review_score_recalculate
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION recalculate_review_score();
