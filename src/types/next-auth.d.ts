import { DefaultSession } from "next-auth";
import { Role } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      memberId?: string;
      memberCode?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
    memberId?: string;
    memberCode?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    memberId?: string;
    memberCode?: string;
  }
}
