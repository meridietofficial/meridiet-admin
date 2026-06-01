import Head from "next/head";
import Login from "../src/components/auth/Login";

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
        <Login />
      </main>
    </div>
  );
}
