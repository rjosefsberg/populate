import {useState} from "react";

function EditEntityForm({entity, onSave, onCancel}) {
    const [editInput, setEditInput] = useState(entity.title);
    const [editBody, setEditBody] = useState(entity.body);

    return (
        <div className="form-group">
            <label>Edit Entity</label>
            <input
                className="form-control"
                value={editInput}
                onChange={e => setEditInput(e.target.value)}
            />
            <label>Description</label>
            <textarea
                className="form-control"
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
            />
            <button className="btn btn-success" onClick={() => onSave(entity.id, editInput, editBody)}>Save</button>
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
    );
}

export default EditEntityForm;