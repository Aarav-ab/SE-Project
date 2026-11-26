import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function importData() {
  console.log("🚀 Starting data import to PostgreSQL / Supabase...");

  const backupPath = path.join(__dirname, "sqlite_backup.json");
  if (!fs.existsSync(backupPath)) {
    console.error("❌ Backup file not found at:", backupPath);
    process.exit(1);
  }

  const { data } = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  // Clean existing tables in reverse dependency order
  console.log("Cleaning any existing records...");
  await prisma.feedback.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.fieldWorker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.announcement.deleteMany();

  // 1. Wards
  console.log(`Importing ${data.wards.length} wards...`);
  for (const ward of data.wards) {
    await prisma.ward.create({
      data: {
        ...ward,
        createdAt: new Date(ward.createdAt),
      },
    });
  }

  // 2. Departments
  console.log(`Importing ${data.departments.length} departments...`);
  for (const dept of data.departments) {
    await prisma.department.create({
      data: {
        ...dept,
        createdAt: new Date(dept.createdAt),
      },
    });
  }

  // 3. Field Workers
  console.log(`Importing ${data.fieldWorkers.length} field workers...`);
  for (const worker of data.fieldWorkers) {
    await prisma.fieldWorker.create({
      data: {
        ...worker,
        createdAt: new Date(worker.createdAt),
        updatedAt: new Date(worker.updatedAt),
      },
    });
  }

  // 4. Users
  console.log(`Importing ${data.users.length} users...`);
  for (const user of data.users) {
    await prisma.user.create({
      data: {
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
  }

  // 5. Complaints
  console.log(`Importing ${data.complaints.length} complaints...`);
  for (const complaint of data.complaints) {
    await prisma.complaint.create({
      data: {
        ...complaint,
        createdAt: new Date(complaint.createdAt),
        updatedAt: new Date(complaint.updatedAt),
        targetCompletion: complaint.targetCompletion ? new Date(complaint.targetCompletion) : null,
        resolvedAt: complaint.resolvedAt ? new Date(complaint.resolvedAt) : null,
      },
    });
  }

  // 6. Attachments
  console.log(`Importing ${data.attachments.length} attachments...`);
  for (const attachment of data.attachments) {
    await prisma.attachment.create({
      data: {
        ...attachment,
        createdAt: new Date(attachment.createdAt),
      },
    });
  }

  // 7. Timeline Events
  console.log(`Importing ${data.timelineEvents.length} timeline events...`);
  for (const event of data.timelineEvents) {
    await prisma.timelineEvent.create({
      data: {
        ...event,
        createdAt: new Date(event.createdAt),
      },
    });
  }

  // 8. Feedbacks
  if (data.feedbacks?.length) {
    console.log(`Importing ${data.feedbacks.length} feedbacks...`);
    for (const feedback of data.feedbacks) {
      await prisma.feedback.create({
        data: {
          ...feedback,
          createdAt: new Date(feedback.createdAt),
        },
      });
    }
  }

  // 9. Announcements
  console.log(`Importing ${data.announcements.length} announcements...`);
  for (const announcement of data.announcements) {
    await prisma.announcement.create({
      data: {
        ...announcement,
        createdAt: new Date(announcement.createdAt),
      },
    });
  }

  console.log("🎉 Successfully imported all records to PostgreSQL / Supabase!");
}

importData()
  .catch((e) => {
    console.error("Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
