export default function RabbitAuthPage() {
  return (
    <main className="rh-paper grid min-h-screen place-items-center px-5 text-center">
      <div className="max-w-[460px] rounded-[28px] border border-[#785a3224] bg-[#fbf6ec] p-8 shadow-[0_18px_60px_rgba(70,45,20,.13)]">
        <h1 className="rh-display text-[34px] font-semibold text-[#2a2018]">Connecting extension</h1>
        <p className="mt-4 text-[16px] leading-6 text-[#6a5a48]">
          If this tab does not close automatically, reload the Rabbit Holes extension and try signing in again.
        </p>
      </div>
    </main>
  );
}
