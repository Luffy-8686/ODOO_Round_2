import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { isValidRole, Role } from "@/lib/roles";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string(),
  phone: z.string().optional(),
});

const UpdateUserSchema = z.object({
  id: z.string(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Only club owners can access user administration." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        member: {
          select: {
            id: true,
            memberId: true,
            status: true,
            memberships: {
              take: 1,
              select: {
                plan: { select: { name: true, tier: true } },
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Only club owners can provision users." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = CreateUserSchema.parse(body);

    if (!isValidRole(validated.role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase().trim(),
        role: validated.role,
        phone: validated.phone,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE_USER",
      entityType: "User",
      entityId: user.id,
      after: { email: user.email, role: user.role },
    });

    return NextResponse.json({ user, message: "User created successfully." }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden. Only club owners can modify user privileges." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = UpdateUserSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: validated.id },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Protect against locking out the last active owner
    if (targetUser.role === "OWNER" && (validated.role !== "OWNER" || validated.isActive === false)) {
      const activeOwnerCount = await prisma.user.count({
        where: { role: "OWNER", isActive: true },
      });
      if (activeOwnerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote or deactivate the last remaining active Owner." },
          { status: 400 }
        );
      }
    }

    const dataToUpdate: any = {};
    if (validated.role && isValidRole(validated.role)) {
      dataToUpdate.role = validated.role;
    }
    if (typeof validated.isActive === "boolean") {
      dataToUpdate.isActive = validated.isActive;
    }
    if (validated.name) dataToUpdate.name = validated.name;
    if (validated.phone !== undefined) dataToUpdate.phone = validated.phone;
    if (validated.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(validated.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: validated.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: updatedUser.id,
      before: { role: targetUser.role, isActive: targetUser.isActive },
      after: { role: updatedUser.role, isActive: updatedUser.isActive },
    });

    return NextResponse.json({
      user: updatedUser,
      message: "User permissions updated successfully.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
