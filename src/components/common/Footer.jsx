import styles from "../../stylesheets/layout.module.scss";
import font from "../../stylesheets/font.module.scss";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <Container
      fluid
      className="mt-5 py-2"
      style={{
        // boxShadow: "0px -1px 14px 0px #00000026",
        // position: "fixed",
        // bottom: "0",
        // width: "100%",
        // maxWidth: "1500px",
        // zIndex: "999",
        // backgroundColor: "#fff",
      }}
    >
      {/* <hr className="my-3" /> */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
        <img
          src="/images/meridiet-logo.png"
          alt="MeriDiet"
          style={{ height: "36px", width: "auto", objectFit: "contain" }}
        />
        <p className={`${font.font12} text-center text-md-end mb-0`}>
          © 2026 MeriDiet. All Rights Reserved.
        </p>
      </div>
    </Container>
  );
}

export default Footer;
