/**
 * Firebase 웹 앱 설정 (Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정).
 * 이 값들은 공개돼도 괜찮다. 데이터 보호는 Firestore 보안 규칙(본인 uid만 읽기/쓰기)이 맡는다.
 * null이면 동기화 기능을 끄고 예전처럼 이 기기에만 저장한다.
 */
export const firebaseConfig: Record<string, string> | null = {
  apiKey: 'AIzaSyBnR4MyOCpFzoSDnDeIv0wDHNt-lkypZ6A',
  authDomain: 'gagyebu-4dba4.firebaseapp.com',
  projectId: 'gagyebu-4dba4',
  storageBucket: 'gagyebu-4dba4.firebasestorage.app',
  messagingSenderId: '549700462098',
  appId: '1:549700462098:web:bac6f2e277f9d96f1cdacb',
}
