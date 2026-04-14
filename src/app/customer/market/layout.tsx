export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 gradient-mesh-art" aria-hidden />
      {children}
    </>
  );
}
