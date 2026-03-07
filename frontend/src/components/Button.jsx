function Button({ text, onClick, disabled, type, className }) {
    return (
        <button onClick={onClick} disabled={disabled} type={type} className={className}>{text}</button>
    )
}

export default Button