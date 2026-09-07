-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "weeklyCapacityHours" INTEGER NOT NULL DEFAULT 40;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "workloadPercent" DECIMAL(6,2),
ADD COLUMN     "workloadUpdatedAt" TIMESTAMP(3);
