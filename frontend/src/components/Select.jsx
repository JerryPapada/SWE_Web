
function Select({ label, onChange, options, value }) {
    return (
        <div className="selects">
            <label className="select-label">{label}</label>
            <select className="select" onChange={onChange} value={value}>
                {options?.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default Select