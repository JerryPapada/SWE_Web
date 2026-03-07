function Input({ label, type, value, onChange, placeholder, error }) {
    return (
        <div className="inputs">
            <label className="input-label">{label}</label>
            <input type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={error ? 'input-error' : 'input'} />
            {error && <span className="error-text">{error}</span>}
        </div>
    )
}

export default Input