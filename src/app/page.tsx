import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth().catch(() => null);
  redirect(session?.user ? "/beranda" : "/masuk");
}
