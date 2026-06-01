import Head from "next/head";
import ForgotPassword from "../src/components/auth/ForgotPassword";

export default function Home() {
  return (
    <div className={``}>
      <Head>
        <title>MeriDiet Admin</title>
        <meta name="description" content="MeriDiet Admin Portal" />
        <link rel="icon" href="/favicon-leaf.png" />
      </Head>

      <main className={``}>
        <section></section>
        <ForgotPassword />
      </main>
    </div>
  );
}
