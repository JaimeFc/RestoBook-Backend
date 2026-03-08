import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import store from '@redux/store';
import theme from '@styles/theme';
import { Provider } from 'react-redux';
import { SnackbarProvider } from 'notistack';
import 'antd/dist/reset.css';

export default function MyApp(props) {
  const { Component, pageProps } = props;

  const Layout = Component.Layout || EmptyLayout;

  return (
    <React.Fragment>
      <Head>
        <title>Restobook</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1.0, width=device-width, height=device-height"
        />
      </Head>
      <Provider store={store}>
        <ConfigProvider theme={theme} locale={esES}>
          <Layout>
            <SnackbarProvider maxSnack={3}>
              <Component {...pageProps} />
            </SnackbarProvider>
          </Layout>
        </ConfigProvider>
      </Provider>
    </React.Fragment>
  );
}

const EmptyLayout = ({ children }) => <>{children} </>;

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
};
