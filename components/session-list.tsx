import { SessionGrid } from "./session-grid";

type Props = {
  excludeSlug?: string;
};

export function SessionList({ excludeSlug }: Props) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <h2>Pilih Sesi Pelatihan</h2>
      <SessionGrid
        excludeSlug={excludeSlug}
        gridClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      />
    </div>
  );
}