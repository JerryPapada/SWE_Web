
function Select({ label, onChange, options, value, error }) {
    return (
        <div className="selects">
            <label className="select-label">{label}</label>
            <select
                className={error ? "select-error" : "select"}
                onChange={onChange}
                value={value}
            >
                <option value="">Select {label}</option>
                {options && options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
}

export default Select