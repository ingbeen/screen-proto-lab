# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목표

이 프로젝트는 **로컬에서 즉시 실행되는 최소 구현 프로토타입을 빠르게 만드는 것**을 목표로 합니다.

### 핵심 원칙

- 속도 최우선: 빠른 구현과 즉각적인 피드백
- 운영/배포/보안/테스트/최적화는 제외
- Mock 데이터와 로컬 state 사용
- **화면 1개 = URL 1개** 원칙 준수

## 개발 환경

### 필수 명령어

**중요**:
- `npm run dev` 명령어는 사용자가 직접 실행합니다. Claude Code는 이 명령어를 실행하지 않습니다.
- **이 프로젝트는 로컬에서만 실행되므로 `npm run build`는 필요하지 않습니다.**
- 프로토타입 검증이 목적이므로 프로덕션 빌드나 배포는 고려하지 않습니다.

```bash
# 개발 서버 실행 (http://localhost:5173) - 사용자가 직접 실행
npm run dev
```

### 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite 6
- **스타일링**: Tailwind CSS v4 (`@tailwindcss/vite` 플러그인)
- **라우팅**: React Router v6
- **UI 컴포넌트**: Radix UI, Material-UI, Motion

## 프로젝트 구조

### 라우팅 아키텍처

- 진입점: [src/main.tsx](src/main.tsx)
- 라우트 정의: [src/routes.tsx](src/routes.tsx) - 모든 화면 URL은 여기서 관리
- 루트 레이아웃: [src/app/App.tsx](src/app/App.tsx) - 네비게이션 바 포함

### 디렉토리 구조

```
src/
├── app/          # 루트 레이아웃 컴포넌트
├── screens/      # 각 URL별 화면 컴포넌트 (EquipmentsScreen, Screen2, Screen3 등)
├── styles/       # 전역 CSS 파일 (index.css, tailwind.css, theme.css, fonts.css)
└── routes.tsx    # React Router 라우트 정의
```

## 코딩 스타일 가이드

### 일반 원칙

- **필요한 경우에만 absolute positioning 사용**: 기본적으로 Flexbox와 Grid를 활용한 반응형 레이아웃 구성
- **코드 작성 중 지속적인 리팩토링**: 깔끔한 코드 유지
- **파일 크기 최소화**: 헬퍼 함수와 컴포넌트는 별도 파일로 분리
- **프로토타입 우선**: 완벽한 구현보다는 빠른 검증을 목표로 함

### 새 화면 추가 시

1. `src/screens/` 디렉토리에 `[ScreenName]Screen.tsx` 파일 생성
2. `src/routes.tsx`에 라우트 추가
3. `src/app/App.tsx`의 네비게이션에 링크 추가

### 컴포넌트 작성

- 함수형 컴포넌트 사용 (`export default function ComponentName()`)
- TypeScript 타입 정의 명확히
- Tailwind 클래스를 사용한 인라인 스타일링
- 복잡한 클래스 조합은 변수로 분리 (예: `navLinkClass`)

### 레이아웃 및 스타일링

- Tailwind v4의 Vite 플러그인 사용 (`@tailwindcss/vite`)
- Tailwind와 React 플러그인은 필수 - 제거 금지
- `@` alias로 src 디렉토리 참조 가능 (예: `@/components/Button`)
- Flexbox와 Grid를 기본으로 사용하여 반응형 레이아웃 구성
- absolute positioning은 꼭 필요한 경우(모달, 툴팁 등)에만 사용

### Mock 데이터

- 컴포넌트 내부 또는 별도 상수로 정의
- API 호출 대신 로컬 state 활용
- 실제 데이터 구조를 모방하되 최소한으로 유지

## 디자인 시스템 가이드라인

### 기본 스타일

- **Base font-size**: 14px (Tailwind의 `text-sm` 활용)
- **색상 체계**: Tailwind 기본 팔레트 사용 (gray, blue 등)
- **간격**: Tailwind spacing 스케일 준수 (2, 3, 4, 6 등)

### UI 컴포넌트 사용

- **드롭다운**: 선택지가 2개 이하인 경우 라디오 버튼이나 토글 사용
- **버튼**: 액션 중요도에 따라 스타일 차별화
  - Primary: 배경색 채움 (bg-blue-600)
  - Secondary: 아웃라인 스타일 (border + hover)
  - Tertiary: 텍스트만 표시
- **칩/태그**: 3개 이상의 세트로 사용

## 주의사항

- Vite 설정에서 React와 Tailwind 플러그인은 Make를 위해 필수이므로 삭제하지 말 것
- 화면 단위는 URL과 1:1 매칭되어야 함
- 성능 최적화나 프로덕션 고려사항보다는 빠른 프로토타이핑에 집중
