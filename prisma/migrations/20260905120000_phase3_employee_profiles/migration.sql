-- Phase 3 — Employee Management (Phases.md).
--
-- Adds the Department entity from Architecture.md section 4, the personal and
-- professional profile fields from PRD.md section 6.2, an optional reporting
-- line to a CompanyAccount, and invite support for CompanyAccounts.
--
-- The free-text `Employee.department` column that Phase 2 used as a placeholder
-- is migrated into real Department rows below before it is dropped, so no
-- existing data is lost.

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FullTime', 'PartTime', 'Contract', 'Intern');

-- AlterTable: CompanyAccount gains the same invite mechanism Employee already
-- has, so Admin / Manager / HR accounts can be invited rather than created with
-- a password chosen by somebody else.
ALTER TABLE "CompanyAccount" ADD COLUMN     "inviteTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "inviteTokenHash" TEXT,
ADD COLUMN     "invitedById" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable: employee profile fields. `department` is dropped further down,
-- after its values have been copied into the new Department table.
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "employmentType" "EmploymentType",
ADD COLUMN     "location" TEXT,
ADD COLUMN     "managerAccountId" TEXT,
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAccount_inviteTokenHash_key" ON "CompanyAccount"("inviteTokenHash");

-- CreateIndex
CREATE INDEX "Employee_managerAccountId_idx" ON "Employee"("managerAccountId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- AddForeignKey
ALTER TABLE "CompanyAccount" ADD CONSTRAINT "CompanyAccount_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "CompanyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerAccountId_fkey" FOREIGN KEY ("managerAccountId") REFERENCES "CompanyAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: turn each distinct free-text department into a real Department row,
-- scoped to its own company (Rules.md section 2 — never across tenants).
INSERT INTO "Department" ("id", "companyId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, e."companyId", TRIM(e."department"), NOW(), NOW()
FROM (
    SELECT DISTINCT "companyId", "department"
    FROM "Employee"
    WHERE "department" IS NOT NULL AND TRIM("department") <> ''
) AS e;

-- Backfill: point each employee at the Department row just created for it.
UPDATE "Employee" AS e
SET "departmentId" = d."id"
FROM "Department" AS d
WHERE d."companyId" = e."companyId"
  AND d."name" = TRIM(e."department")
  AND e."department" IS NOT NULL;

-- The placeholder column has now been fully migrated.
ALTER TABLE "Employee" DROP COLUMN "department";
