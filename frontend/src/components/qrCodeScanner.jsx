import { Scanner } from '@yudiel/react-qr-scanner';
import Button from './Button';

function QrCodeScanner({ onClose, onScanSuccess, onScanError }) {
    return (
        <div className="scanner">
            <div className="scanner-window">
                <h2>Scan QR Code</h2>
                <div className="scanner-container">
                    <Scanner
                        onScan={(detectedCodes) => {
                            if (detectedCodes && detectedCodes.length > 0) {
                                const resultText = detectedCodes[0].rawValue;
                                onScanSuccess(resultText);
                            }
                        }}
                        onError={(err) => {
                            if (onScanError) onScanError(err.message || "Camera error");
                        }}
                    />
                </div>
                <Button text="Close" onClick={onClose} type="button" className="button save-button close-scanner-btn" />
            </div>
        </div>
    );
}

export default QrCodeScanner;
