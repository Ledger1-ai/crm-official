import { prismadb } from "@/lib/prisma";

export const getStorageSize = async () => {
  const agg = await prismadb.documents.aggregate({
    _sum: { size: true },
  });
  const storageSizeBytes = Number(agg._sum.size ?? 0);
  const storageSizeMB = storageSizeBytes / 1_000_000;
  return Math.round(storageSizeMB * 100) / 100;
};
