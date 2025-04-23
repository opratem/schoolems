import React from 'react';

const Spinner = () => {
    return (
        <div className="spinner-container" style={styles.container}>
            <div className="spinner-border text-primary" role="status" style={styles.spinner}>
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
    },
    spinner: {
        width: '3rem',
        height: '3rem',
    },
};

export default Spinner;
