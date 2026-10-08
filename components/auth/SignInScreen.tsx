'use client';

import {useState} from 'react';
import {signIn} from 'next-auth/react';
import Image from 'next/image';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Center} from '@astryxdesign/core/Center';
import {Divider} from '@astryxdesign/core/Divider';
import {Heading} from '@astryxdesign/core/Heading';
import {VStack} from '@astryxdesign/core/Layout';
import {Text} from '@astryxdesign/core/Text';
import {Theme} from '@astryxdesign/core/theme';
import {InternationalizationProvider} from '@astryxdesign/core/i18n';
import vi from '@astryxdesign/core/locales/vi-VN.json';
import {matchaTheme} from '@/src/themes/matcha/matcha';

function errorDescription(error: string) {
  if (error === 'AccessDenied') return 'Tài khoản này chưa được cho phép đăng nhập. Thử tài khoản Google khác hoặc liên hệ người quản lý.';
  if (error === 'Configuration') return 'Đăng nhập tạm thời chưa sẵn sàng. Vui lòng liên hệ người quản lý để được hỗ trợ.';
  return 'Phiên đăng nhập chưa hoàn tất. Vui lòng thử lại với tài khoản Google của bạn.';
}

export function SignInScreen({destination, error}: {destination: string; error?: string}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function continueWithGoogle() {
    setPending(true);
    setFailed(false);
    try {
      await signIn('google', {redirectTo: destination});
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <Theme theme={matchaTheme} mode="system">
      <InternationalizationProvider locale="vi-VN" messages={{'vi-VN': vi}}>
        <Center role="main" minHeight="100svh" padding={5}>
          <Card maxWidth={440} width="100%" padding={8} elevation="low">
            <VStack gap={8}>
              <VStack gap={4} hAlign="center">
                <Image src="/images/astryx-dark.svg" alt="Logo ứng dụng" width={280} height={280} className="size-16" />
                <VStack gap={3}>
                  <Heading level={1} justify="center">Quản lý đất đai</Heading>
                  <Text color="secondary" justify="center">Khu đất, khách hàng và hợp đồng.<br />Một nơi để quản lý mỗi ngày.</Text>
                </VStack>
              </VStack>
              <Divider />
              <VStack gap={4}>
                <VStack gap={4}>
                  <Heading level={2} justify="center">Đăng nhập</Heading>
                  <Text color="secondary" justify="center">Dùng tài khoản Google của bạn để tiếp tục vào không gian quản lý.</Text>
                </VStack>
                {(error || failed) && <Banner status="error" title="Chưa thể đăng nhập"
                  description={failed ? 'Không thể kết nối. Kiểm tra kết nối mạng và thử lại.' : errorDescription(error!)} />}
                <Button label={pending ? 'Đang chuyển đến Google…' : 'Tiếp tục với Google'}
                  variant="primary" size="lg" width="100%" isLoading={pending}
                  onClick={() => {void continueWithGoogle();}} />
                <Text color="secondary" size="sm" justify="center">Bạn sẽ chọn tài khoản trên trang đăng nhập của Google.</Text>
              </VStack>
            </VStack>
          </Card>
        </Center>
      </InternationalizationProvider>
    </Theme>
  );
}
