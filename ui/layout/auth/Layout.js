import { Row, Col, Typography, Button } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';

const { Title, Text } = Typography;

const Wrap = styled.div`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@400;600;700&display=swap');

  --bg: #f2f6fb;
  --card: #ffffff;
  --ink: #0b1b2b;
  --muted: #5b6b7c;
  --brand: #2b6cb0;
  --brand-dark: #245a93;
  --accent: #5fa8ff;
  --shadow: 0 24px 60px rgba(17, 38, 75, 0.14);

  font-family: 'Manrope', 'DM Sans', sans-serif;
  background: radial-gradient(
      900px 450px at 8% 12%,
      #d8e8ff 0%,
      transparent 60%
    ),
    radial-gradient(700px 380px at 90% 10%, #e9f1ff 0%, transparent 55%),
    radial-gradient(600px 420px at 20% 80%, #d6e3f5 0%, transparent 50%),
    var(--bg);
  position: relative;
  min-height: 100vh;
  overflow: hidden;
`;

const Main = styled(Row)`
  min-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 56px 16px 72px;
`;

const Container = styled(Row)`
  width: 100%;
  max-width: 980px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 32px;
  align-items: center;
  animation: fadeUp 600ms ease;

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const LogoContainer = styled(Col)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  color: var(--ink);
  padding: 8px 12px;
  gap: 18px;
`;

const FormContainer = styled(Col)`
  background-color: var(--card);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  text-align: left;
  padding: 32px;
  border-radius: 18px;
  box-shadow: var(--shadow);
  border: 1px solid rgba(43, 108, 176, 0.12);
  max-width: 500px;
  width: 100%;
  justify-self: end;

  @media (max-width: 900px) {
    max-width: 520px;
    justify-self: center;
  }
`;

const ChildrenContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  margin-top: 12px;
`;

const LinksContainer = styled(Row)`
  width: 100%;
  max-width: 300px;
  margin-top: 20px;
`;

const StyledLink = styled.a`
  color: var(--brand);
  cursor: pointer;
  font-weight: 600;

  &:hover {
    color: var(--accent);
  }
`;

const CopyrightContainer = styled(Row)`
  background-color: #e4edf9;
  justify-content: center;
  align-items: center;
  height: 32px;
  color: #415062;
  font-weight: 600;
  font-size: 12px;
`;

const BrandTitle = styled(Title)`
  color: var(--ink) !important;
  margin: 0 !important;
  font-size: 42px !important;
  line-height: 1.05 !important;
  font-weight: 700 !important;

  @media (max-width: 900px) {
    font-size: 36px !important;
  }
`;

const BrandText = styled(Text)`
  color: var(--muted) !important;
  font-size: 16px !important;
  line-height: 1.6 !important;
`;

const FormTitle = styled(Title)`
  color: var(--ink) !important;
  margin: 0 !important;
  font-size: 24px !important;
  font-weight: 700 !important;
`;

const FormSubtitle = styled(Text)`
  color: var(--muted) !important;
  font-size: 14px !important;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoBadge = styled.div`
  background: rgba(43, 108, 176, 0.14);
  color: var(--brand-dark);
  font-weight: 700;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

const Signin = ({
  children,
  logo,
  institution,
  subtitle,
  signin = true,
  forgot = true,
  signup = true,
}) => {
  const router = useRouter();
  const isSigninPage = router.pathname === '/auth/signin';
  const currentYear = new Date().getFullYear();
  const brandName = institution || 'RestoBook';

  return (
    <Wrap>
      <Main>
        <Container>
          <LogoContainer>
            <LogoRow>
              <div
                style={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={logo || 'https://img.icons8.com/?size=100&id=51071&format=png&color=000000'}
                  alt="kick-off-logo"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <LogoBadge>Reservas_Go</LogoBadge>
            </LogoRow>
            <BrandTitle level={1}>{brandName}</BrandTitle>
            <BrandText>
              Reserva tu mesa favorita en segundos. Gestiona horarios, menús y confirmaciones en una sola plataforma.
            </BrandText>
            {subtitle && <BrandText>{subtitle}</BrandText>}
          </LogoContainer>

          <FormContainer>
            <FormTitle level={4}>Inicia sesión</FormTitle>
            <FormSubtitle>
              Accede a tu cuenta para gestionar reservas.
            </FormSubtitle>
            <ChildrenContainer>{children}</ChildrenContainer>

            <LinksContainer>
              {isSigninPage && (
                <Col span={24} style={{ marginBottom: 8, textAlign: 'center' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>
                    ¿No tienes una cuenta?{' '}
                    {signup && (
                      <Button
                        type="link"
                        onClick={() => router.push('/auth/signup')}
                        style={{ padding: 0, color: 'var(--brand)', fontWeight: 600 }}
                      >
                        Regístrate
                      </Button>
                    )}
                  </span>
                </Col>
              )}
              <Col span={12} style={{ textAlign: 'left' }}>
                {signin && (
                  <Link href="/auth/signin" passHref legacyBehavior>
                    <StyledLink>Iniciar sesión</StyledLink>
                  </Link>
                )}
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                {forgot && (
                  <Link href="/auth/recover" passHref legacyBehavior>
                    <StyledLink>Olvidaste tu contraseña?</StyledLink>
                  </Link>
                )}
              </Col>
              <Col span={24} style={{ marginTop: 16, textAlign: 'left' }}>
                <Link href="/policies" passHref legacyBehavior>
                  <StyledLink>Política de Privacidad</StyledLink>
                </Link>
              </Col>
            </LinksContainer>
          </FormContainer>
        </Container>
      </Main>
      <CopyrightContainer>
        Copyright © RestoBook {currentYear}
      </CopyrightContainer>
    </Wrap>
  );
};

export default Signin;
