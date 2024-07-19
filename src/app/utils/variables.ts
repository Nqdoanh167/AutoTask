import {EVoicePlatform, EVoicePlatformType} from '@app/types/sms-ott-call';

export const VOICE_PLATFORMS = [
  {
    value: EVoicePlatform.STRINGEE,
    label: 'Stringee',
    type: EVoicePlatformType.VOICE,
    icon: './assets/images/logo-platforms/logo-platform-stringee.png',
  },
  {
    value: EVoicePlatform.VFONE,
    label: 'Vfone',
    type: EVoicePlatformType.VOICE,
    icon: './assets/images/logo-platforms/logo-platform-vfone.png',
  },
  {
    value: EVoicePlatform.OMICALL,
    label: 'Omicall',
    type: EVoicePlatformType.VOICE,
    icon: './assets/images/logo-platforms/logo-platform-omicall.png',
  },
  {
    value: EVoicePlatform.PORTSIP,
    label: 'Portsip',
    type: EVoicePlatformType.VOICE,
    icon: './assets/images/logo-platforms/logo-platform-portsip.png',
  },
  {
    value: EVoicePlatform.ESMS,
    label: 'Esms',
    type: EVoicePlatformType.SMS,
    icon: './assets/images/logo-platforms/logo-platform-esms.png',
  },
  {
    value: EVoicePlatform.ZNS,
    label: 'ZNS',
    type: EVoicePlatformType.SMAX_AGENCY,
    icon: './assets/images/logo-platforms/logo-platform-zns.png',
  },
  {
    value: EVoicePlatform.SMAX_SMS,
    label: 'Smax SMS',
    type: EVoicePlatformType.SMAX_AGENCY,
    icon: './assets/images/logo-platforms/logo-platform-smax.png',
  },
  {
    value: EVoicePlatform.SMAX_ZNS,
    label: 'Smax ZNS',
    type: EVoicePlatformType.SMAX_AGENCY,
    icon: './assets/images/logo-platforms/logo-platform-smax.png',
  },
];
