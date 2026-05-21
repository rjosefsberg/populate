import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import AddEntityForm from "./AddEntityForm";

function AddEntityModal({show, onHide}) {

    const handleClose = () => onHide();

    return (
        <>
            <Modal show={show} onHide={handleClose} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body><AddEntityForm></AddEntityForm></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AddEntityModal;