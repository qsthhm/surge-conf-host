export const dynamic = "force-dynamic";  // 禁止静态化，避免 cookie 丢失
export const revalidate = 0;

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./ui";

export default function Page({ params }: { params: { token: string } }) {
  // 检查 session cookie
  const hasSession = cookies().get("session")?.value;
  if (!hasSession) {
    // 如果未登录，跳转到根路径的登录页
    redirect("/");
  }

  return <DashboardClient token={params.token} />;
}
