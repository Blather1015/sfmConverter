// tabs/ConvertTab.js
import React from 'react';

function ConvertTab({
    fileNameInput,
    setFileNameInput,
    sfmContent,
    liftContent,
    handleConvert,
    handleConvertLIFT,
    handleExportToExcel,
    handleDownload,
    handleLiftDownload,
    handleReset,
    fileType
}) {
    return (
        <div>
            {fileType !== 'sfm' && (
                <button onClick={handleConvert} style={{ marginTop: 10 }}>
                    Convert to SFM
                </button>
            )}

            {fileType === 'sfm' && (
                <button onClick={handleExportToExcel} style={{ marginTop: 10 }}>
                    Export to Excel
                </button>
            )}

            {fileType !== 'sfm' && (
                <button onClick={handleConvertLIFT} style={{ marginLeft: 10 }}>
                    Convert to LIFT
                </button>
            )}

            {(sfmContent || liftContent) && (
                <div>
                    <div style={{ marginTop: 20 }}>
                        <label>Custom file name:</label>
                        <input
                            type="text"
                            value={fileNameInput}
                            onChange={(e) => setFileNameInput(e.target.value)}
                            placeholder="Enter file name"
                            style={{ marginLeft: 10 }}
                        />
                    </div>

                    {sfmContent && (
                        <>
                            <h2>SFM Conversion success 🎉</h2>
                            <button onClick={handleDownload}>Download .sfm file</button>
                        </>
                    )}

                    {liftContent && (
                        <>
                            <h2>LIFT Conversion success 🎉</h2>
                            <button onClick={handleLiftDownload}>Download .lift ZIP</button>
                        </>
                    )}

                    <button
                        onClick={handleReset}
                        style={{ marginLeft: 10, backgroundColor: '#dc3545' }}
                    >
                        Reset
                    </button>

                    <h3>Preview:</h3>
                    <pre className="sfm-preview">{sfmContent || liftContent}</pre>
                </div>
            )}
        </div>
    );
}

export default ConvertTab;
