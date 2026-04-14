export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 gradient-mesh-food" aria-hidden />
      {children}
    </>
  );
}
