import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting NagrikConnect database seed...");

  // 1. Clean existing records in reverse dependency order
  await prisma.feedback.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.fieldWorker.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.announcement.deleteMany();

  // 2. Seed Wards
  console.log("Seeding wards...");
  const ward14 = await prisma.ward.create({
    data: {
      id: "ward-14",
      name: "Ward 14 - Indiranagar East",
      code: "W14",
      zone: "East Zone, Bengaluru",
      active: true,
    },
  });

  const ward12 = await prisma.ward.create({
    data: {
      id: "ward-12",
      name: "Ward 12 - Domlur",
      code: "W12",
      zone: "East Zone, Bengaluru",
      active: true,
    },
  });

  // 3. Seed Departments
  console.log("Seeding departments...");
  const pwd = await prisma.department.create({
    data: {
      id: "pwd",
      name: "Roads & Public Works (PWD)",
      code: "PWD",
      description: "Road repairs, potholes, paver blocks, footpaths, bridges",
      contactPhone: "080-22221111",
      contactEmail: "pwd@nagrikconnect.gov.in",
      defaultSlaHours: 48,
    },
  });

  const electrical = await prisma.department.create({
    data: {
      id: "electrical",
      name: "Electrical & Streetlighting",
      code: "ELEC",
      description: "Streetlights, poles, dark spots, public electric fixtures",
      contactPhone: "080-22222222",
      contactEmail: "electrical@nagrikconnect.gov.in",
      defaultSlaHours: 24,
    },
  });

  const swm = await prisma.department.create({
    data: {
      id: "swm",
      name: "Sanitation (SWM)",
      code: "SWM",
      description: "Solid waste management, garbage clearance, sweepers",
      contactPhone: "080-22223333",
      contactEmail: "swm@nagrikconnect.gov.in",
      defaultSlaHours: 24,
    },
  });

  const water = await prisma.department.create({
    data: {
      id: "water",
      name: "Water Supply & Drainage",
      code: "BWSSB",
      description: "Water pipes, sewer leaks, open drains, manholes",
      contactPhone: "080-22224444",
      contactEmail: "water@nagrikconnect.gov.in",
      defaultSlaHours: 36,
    },
  });

  // 4. Seed Field Workers
  console.log("Seeding field workers...");
  const worker1 = await prisma.fieldWorker.create({
    data: {
      id: "worker-manoj",
      name: "Er. Manoj Kumar",
      initials: "MK",
      role: "Junior Engineer • Roads & PWD",
      departmentId: pwd.id,
      status: "On-Site: Asphalt Patching",
      dotColor: "#fe8439",
      phone: "+91 98765 43210",
      ticketsClosedMonth: 14,
      avgResolutionHours: 22.0,
    },
  });

  const worker2 = await prisma.fieldWorker.create({
    data: {
      id: "worker-suresh",
      name: "Suresh Rao",
      initials: "SR",
      role: "Electrician • Streetlighting",
      departmentId: electrical.id,
      status: "On-Site: Lamp Replacement",
      dotColor: "#fe8439",
      phone: "+91 98765 43211",
      ticketsClosedMonth: 19,
      avgResolutionHours: 9.0,
    },
  });

  const worker3 = await prisma.fieldWorker.create({
    data: {
      id: "worker-ramesh",
      name: "K. Ramesh",
      initials: "KR",
      role: "Sanitary Inspector • SWM Unit 3",
      departmentId: swm.id,
      status: "Available Now",
      dotColor: "#61b15f",
      phone: "+91 98765 43212",
      ticketsClosedMonth: 27,
      avgResolutionHours: 5.0,
    },
  });

  const worker4 = await prisma.fieldWorker.create({
    data: {
      id: "worker-anita",
      name: "Anita Verma",
      initials: "AV",
      role: "Zonal QC Inspector",
      departmentId: water.id,
      status: "On-Site: Drain Audit",
      dotColor: "#fe8439",
      phone: "+91 98765 43213",
      ticketsClosedMonth: 31,
      avgResolutionHours: 2.0,
    },
  });

  const worker5 = await prisma.fieldWorker.create({
    data: {
      id: "worker-deepak",
      name: "Deepak Prasad",
      initials: "DP",
      role: "Compactor Driver • SWM Unit 1",
      departmentId: swm.id,
      status: "Off-Duty (Rotation)",
      dotColor: "#c4c6cf",
      phone: "+91 98765 43214",
      ticketsClosedMonth: 22,
      avgResolutionHours: 4.0,
    },
  });

  const worker6 = await prisma.fieldWorker.create({
    data: {
      id: "worker-nisha",
      name: "Nisha Pillai",
      initials: "NP",
      role: "Junior Engineer • Roads & PWD",
      departmentId: pwd.id,
      status: "Available Now",
      dotColor: "#61b15f",
      phone: "+91 98765 43215",
      ticketsClosedMonth: 16,
      avgResolutionHours: 26.0,
    },
  });

  // 5. Seed Users
  console.log("Seeding users...");
  const citizenPasswordHash = await bcrypt.hash("Citizen@123", 10);
  const adminPasswordHash = await bcrypt.hash("admin@123", 10);
  const fallbackPasswordHash = await bcrypt.hash("password123", 10);

  const citizenUser = await prisma.user.create({
    data: {
      id: "user-citizen",
      email: "citizen123@gmail.com",
      passwordHash: citizenPasswordHash,
      name: "Rajesh Sharma",
      phone: "+91 98765 00001",
      role: "citizen",
      wardId: ward14.id,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      id: "user-admin",
      email: "admin123@gmail.com",
      passwordHash: adminPasswordHash,
      name: "Anita Rao (Admin)",
      phone: "+91 98765 00002",
      role: "admin",
      wardId: ward14.id,
    },
  });

  // Legacy/demo fallbacks
  await prisma.user.create({
    data: {
      id: "user-rajesh-legacy",
      email: "rajesh@example.com",
      passwordHash: fallbackPasswordHash,
      name: "Rajesh Sharma",
      phone: "+91 98765 00003",
      role: "citizen",
      wardId: ward14.id,
    },
  });

  // 6. Seed Complaints & Timelines
  console.log("Seeding complaints and timelines...");

  // Complaint 1
  const c1 = await prisma.complaint.create({
    data: {
      id: "GRV-2025-W14-8902",
      title: "Pothole repair on 12th Main Road, Ward 14",
      description: "Severe pothole cluster near HAL 2nd Stage Junction causing traffic bottleneck and accident risk.",
      complaintType: "Pothole / Road",
      priority: "Urgent",
      status: "In Progress",
      address: "12th Main, near HAL 2nd Stage Junction",
      pinCode: "560038",
      landmark: "Near 80ft Road Junction, Hoysala Nagar",
      latitude: 12.9716,
      longitude: 77.6412,
      wardId: ward14.id,
      departmentId: pwd.id,
      assignedWorkerId: worker1.id,
      userId: citizenUser.id,
      targetCompletion: new Date(Date.now() + 12 * 3600 * 1000),
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        complaintId: c1.id,
        title: "Complaint Registered",
        description: "Your complaint was successfully registered in Ward 14.",
        status: "Registered",
        author: "System / Rajesh Sharma",
        step: 1,
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        complaintId: c1.id,
        title: "Department Assigned",
        description: "The complaint was forwarded to Roads & Public Works (PWD).",
        status: "Assigned",
        comment: "The repair request has been assigned to the road maintenance team.",
        author: "Municipal Administrator",
        step: 2,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
      {
        complaintId: c1.id,
        title: "Work in Progress",
        description: "An on-site asphalt patching team has been deployed.",
        status: "In Progress",
        comment: "Patching crew deployed with hot-mix asphalt. Work in progress.",
        author: "Junior Engineer Er. Manoj Kumar",
        step: 3,
        createdAt: new Date(Date.now() - 1 * 3600 * 1000),
      },
    ],
  });

  // Complaint 2
  const c2 = await prisma.complaint.create({
    data: {
      id: "GRV-2025-W14-9140",
      title: "Broken Sump Grating & Drain Overflow",
      description: "Stormwater drain grating broken, drain overflowing into pedestrian walkway near BDA complex.",
      complaintType: "Drainage / Water",
      priority: "Urgent",
      status: "Pending Dispatch",
      address: "4th Cross Road, BDA Complex Perimeter",
      pinCode: "560038",
      landmark: "BDA Complex, 4th Cross",
      latitude: 12.9734,
      longitude: 77.6428,
      wardId: ward14.id,
      departmentId: water.id,
      userId: citizenUser.id,
      targetCompletion: new Date(Date.now() + 24 * 3600 * 1000),
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  });

  await prisma.timelineEvent.create({
    data: {
      complaintId: c2.id,
      title: "Complaint Registered",
      description: "Complaint logged and awaiting crew assignment.",
      status: "Submitted",
      author: "Rajesh Sharma",
      step: 1,
      createdAt: new Date(Date.now() - 1 * 3600 * 1000),
    },
  });

  // Complaint 3
  const c3 = await prisma.complaint.create({
    data: {
      id: "GRV-2025-W14-8841",
      title: "Dislodged Pedestrian Paver Blocks",
      description: "Broken paver blocks creating trip hazard along metro walkway.",
      complaintType: "Pothole / Road",
      priority: "Medium",
      status: "Resolved",
      address: "100 Feet Road, Near Metro Pillar 42",
      pinCode: "560038",
      landmark: "Metro Pillar 42",
      latitude: 12.975,
      longitude: 77.644,
      wardId: ward14.id,
      departmentId: pwd.id,
      assignedWorkerId: worker1.id,
      userId: citizenUser.id,
      resolvedAt: new Date(Date.now() - 5 * 3600 * 1000),
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        complaintId: c3.id,
        title: "Complaint Registered",
        description: "Complaint logged.",
        status: "Registered",
        author: "Rajesh Sharma",
        step: 1,
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        complaintId: c3.id,
        title: "Resolution & Verification",
        description: "Paver blocks re-levelled and cemented firmly. Inspection verified.",
        status: "Resolved",
        comment: "Completed within 19 hours. Verified by site supervisor.",
        author: "Er. Manoj Kumar",
        step: 4,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000),
      },
    ],
  });

  // Complaint 4
  const c4 = await prisma.complaint.create({
    data: {
      id: "GRV-2025-W14-8712",
      title: "Streetlight Blackout near Sector 4 Park",
      description: "Streetlight blackout near Sector 4 Park, Lane 2. Multiple poles completely unlit at night.",
      complaintType: "Streetlight",
      priority: "Medium",
      status: "In Progress",
      address: "Sector 4 Central Park, Lane 2 (Poles 14-16)",
      pinCode: "560038",
      landmark: "Central Park Lane 2",
      latitude: 12.969,
      longitude: 77.639,
      wardId: ward14.id,
      departmentId: electrical.id,
      assignedWorkerId: worker2.id,
      userId: citizenUser.id,
      createdAt: new Date(Date.now() - 20 * 3600 * 1000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        complaintId: c4.id,
        title: "Complaint Registered",
        description: "Streetlight outage recorded.",
        status: "Registered",
        author: "Rajesh Sharma",
        step: 1,
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      },
      {
        complaintId: c4.id,
        title: "Work in Progress",
        description: "Electrician dispatched with spare LED fixtures and ladder truck.",
        status: "In Progress",
        author: "Suresh Rao",
        step: 3,
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      },
    ],
  });

  // Complaint 5
  const c5 = await prisma.complaint.create({
    data: {
      id: "GRV-2025-W14-8650",
      title: "Overflowing Community Garbage Bin",
      description: "Community bin overflowing onto street sidewalk causing foul odor.",
      complaintType: "Garbage / Waste",
      priority: "Low",
      status: "Resolved",
      address: "Market Square Corner, Opposite Post Office",
      pinCode: "560038",
      landmark: "Opposite Post Office",
      latitude: 12.968,
      longitude: 77.643,
      wardId: ward14.id,
      departmentId: swm.id,
      assignedWorkerId: worker3.id,
      userId: citizenUser.id,
      resolvedAt: new Date(Date.now() - 40 * 3600 * 1000),
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
  });

  await prisma.timelineEvent.createMany({
    data: [
      {
        complaintId: c5.id,
        title: "Complaint Registered",
        description: "Garbage overflow reported.",
        status: "Registered",
        author: "Rajesh Sharma",
        step: 1,
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        complaintId: c5.id,
        title: "Resolution & Verification",
        description: "Compactor vehicle emptied bin and sanitized perimeter.",
        status: "Resolved",
        author: "K. Ramesh",
        step: 4,
        createdAt: new Date(Date.now() - 40 * 3600 * 1000),
      },
    ],
  });

  // 7. Seed Announcements
  console.log("Seeding announcements...");
  await prisma.announcement.createMany({
    data: [
      {
        title: "Scheduled Water Supply Maintenance - Ward 14",
        content: "BWSSB will be conducting preventive maintenance on pipeline line B tomorrow from 10:00 AM to 04:00 PM.",
        category: "Maintenance",
        wardId: ward14.id,
      },
      {
        title: "Monsoon Preparedness & Drain Cleaning Drive",
        content: "BBMP PWD teams will inspect and de-silt all major roadside drains this week in Indiranagar.",
        category: "Advisory",
        wardId: ward14.id,
      },
    ],
  });

  console.log("✅ NagrikConnect database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
