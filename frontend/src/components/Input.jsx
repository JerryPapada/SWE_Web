function Input({ label, type, value, onChange, placeholder, error, accept }) {
    return (
        <div className="inputs">
            <label className="input-label">{label}</label>
            <input type={type}
                onChange={onChange}
                placeholder={placeholder}
                accept={accept}
                checked={type === "checkbox" ? value : undefined}
                value={type !== "checkbox" ? value : undefined}
                className={error ? 'input-error' : 'input'} />
            {error && <span className="error-text">{error}</span>}
        </div>
    )
}

export default Input