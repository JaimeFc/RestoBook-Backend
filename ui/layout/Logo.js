import Image from 'next/image';

const Logo = ({ logo, collapsed }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: collapsed ? '16px 8px' : '20px 16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: collapsed ? '48px' : '100%',
          maxWidth: collapsed ? '48px' : '200px',
          padding: collapsed ? '10px' : '12px 16px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          borderRadius: collapsed ? '12px' : '16px',
          boxShadow: collapsed
            ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)'
            : '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: collapsed ? '28px' : '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={logo || '/assets/images/react.png'}
            alt="Restobook"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Logo;
