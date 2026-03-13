function Textarea({ label, type, value, onChange, placeholder, error }) {
    return (
        <div className="textAreas">
            <label className="textArea-label">{label}</label>
            <textarea type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={error ? 'textArea-error' : 'textArea'}
            />
            {error && <span className="error-text">{error}</span>}
        </div>

    )
}

export default Textarea