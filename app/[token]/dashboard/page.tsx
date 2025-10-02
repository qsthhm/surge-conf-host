// app/[token]/dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./ui";

export default function Page({ params }: { params: { token: string } }) {
  const has = cookies().get("session")?.value;
  if (!has) redirect(`/${params.token}`); // 未登录，回到该 token 的登录页
  return <DashboardClient token={params.token} />;
}
