import "../src/globals.css";
import store from "../src/store/auth.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { SSRProvider, ThemeProvider } from "react-bootstrap";
import { Provider } from "react-redux";
import { UserAuthContextProvider } from "../src/firebase/auth/UserAuthContext";
import toast, { Toaster } from "react-hot-toast";
import Layout from "../src/components/layout"; // ✅ Import Layout
import Header from "../src/components/common/Header";
import Footer from "../src/components/common/Footer";
import Head from "next/head";
import { useRouter } from "next/router";
import { LoaderProvider, useLoader } from "../src/constants/LoaderContext";
import LoaderR from "../src/components/common/LoaderR.js";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isDashboard = router.pathname.startsWith("/dashboard");

  return (
    <ThemeProvider>
      <SSRProvider>
        <Provider store={store}>
          <UserAuthContextProvider>
            <LoaderProvider>
              <LoaderHandler /> {/* 🔁 Show loader when active */}
              <Toaster />
              <Head>
                <title>MeriDiet Admin</title>
                <meta name="description" content="MeriDiet Admin Portal" />
                <link rel="icon" href="/favicon-leaf.png" />
              </Head>
              {isDashboard ? (
                <>
                  <Header />
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>

                </>
              ) : (
                <Component {...pageProps} />
              )}
              <div id="recaptcha-container" className="d-none" />
            </LoaderProvider>
          </UserAuthContextProvider>
        </Provider>
      </SSRProvider>
    </ThemeProvider>
  );
}

const LoaderHandler = () => {
  const { loading } = useLoader();
  return loading ? <LoaderR /> : null;
};

export default MyApp;
