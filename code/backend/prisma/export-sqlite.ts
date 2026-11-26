import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("📦 Exporting current SQLite database data...");

  const wards = await prisma.ward.findMany();
  const departments = await prisma.department.findMany();
  const users = await prisma.user.findMany();
  const fieldWorkers = await prisma.fieldWorker.findMany();
  const complaints = await prisma.complaint.findMany();
  const attachments = await prisma.attachment.findMany();
  const timelineEvents = await prisma.timelineEvent.findMany();
  const feedbacks = await prisma.feedback.findMany();
  const announcements = await prisma.announcement.findMany();

  const dump = {
    exportedAt: new Date().toISOString(),
    counts: {
      wards: wards.length,
      departments: departments.length,
      users: users.length,
      fieldWorkers: fieldWorkers.length,
      complaints: complaints.length,
      attachments: attachments.length,
      timelineEvents: timelineEvents.length,
      feedbacks: feedbacks.length,
      announcements: announcements.length,
    },
    data: {
      wards,
      departments,
      users,
      fieldWorkers,
      complaints,
      attachments,
      timelineEvents,
      feedbacks,
      announcements,
    },
  };

  const outPath = path.join(__dirname, "sqlite_backup.json");
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), "utf8");

  console.log("✅ Successfully exported SQLite data to:", outPath);
  console.log("Summary:", dump.counts);
}

exportData()
  .catch((e) => {
    console.error("Export error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
