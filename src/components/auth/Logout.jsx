import { Modal, Button, Image } from "react-bootstrap";
import font from "../../stylesheets/font.module.scss";
import { useRouter } from "../../helpers/useRouter";
function Logout({ show, handleClose }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router?.push("/");
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Body className="dflexCC flex-column py-5">
        <h3>Are you sure you want to log out?</h3>
        <Image src="../images/Frame 26080638.png" className="img img-fluid my-4" />
        <br />
        <div className="dflexAC">
          <Button
            className="me-3 p-2 px-3"
            variant="outline-success"
            onClick={handleClose}
          >
            No, cancel
          </Button>
          <Button
            className={`${font.logoutBtn} dflexAC p-2 px-3`}
            onClick={handleLogout}
          >
            Yes, Logout
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default Logout;
