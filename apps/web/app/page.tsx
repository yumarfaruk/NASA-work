import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard {...data} />;
}
