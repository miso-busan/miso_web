# (사)미소금융부산중구법인 웹사이트

![Miso Financial](assets/mascot_main.png)

> 서민에게 희망을, 내일에 미소를. (사)미소금융부산중구법인의 공식 웹사이트 소스코드 저장소입니다.

본 프로젝트는 금융소외계층의 경제적 자립을 지원하는 **(사)미소금융부산중구법인**의 온라인 플랫폼을 구축하기 위해 제작되었습니다. 사용자 친화적인 UI/UX와 신뢰감을 주는 모던한 디자인을 적용하였으며, GitHub Pages를 통해 정적 웹사이트로 배포될 수 있도록 최적화되었습니다.

---

## 🌐 배포(Deployment)

이 웹사이트는 **GitHub Pages**를 통해 호스팅될 예정입니다.
레포지토리 설정(Settings) > Pages 메뉴에서 `Source`를 `main` 브랜치로 설정하면 즉시 배포됩니다.

- **데모 사이트**: [GitHub Pages URL will be here]

## ✨ 주요 기능 및 디자인

### 1. 사용자 경험(UX) 중심 설계
- **반응형 웹 디자인 (Responsive Web Design)**: PC, 태블릿, 모바일 등 모든 디바이스에서 최적화된 화면을 제공합니다.
- **직관적인 네비게이션**: 메가 메뉴(Mega Menu) 방식을 도입하여 원하는 정보(지원상품, 대출절차 등)에 빠르게 접근할 수 있습니다.
- **브랜드 히어로 섹션**: 메인 상단에 배경 영상과 글래스모피즘(Glassmorphism) 오버레이를 적용하여 전문적이고 신뢰감 있는 첫인상을 줍니다.

### 2. 핵심 서비스 안내
- **맞춤형 대출 상품 소개**: 창업자금, 운영자금, 시설개선자금 등 주요 상품을 카드 형태로 알기 쉽게 정리했습니다.
- **성공 사례 (Review)**: 실제 이용자들의 성공 스토리를 통해 신뢰도를 높였습니다.
- **간편 대출 계산기**: `Javascript` 기반의 대출 계산기를 통해 예상 월 상환금을 미리 확인해볼 수 있습니다.
- **AI 상담 챗봇**: 시나리오 기반 챗봇 모달로 비대면 상담 흐름(상품 탐색/진단/서류 안내)을 제공합니다.

## 🛠 기술 스택 (Tech Stack)

별도의 복잡한 빌드 과정 없이, 가볍고 빠르게 동작하는 **표준 웹 기술**을 사용했습니다.

- **Core**: HTML5, CSS3 (Modern Features), JavaScript (ES6+)
- **Styling**: 
  - Pure CSS Variables (Custom Properties)
  - Flexbox & Grid Layout
  - CSS Keyframe Animations
- **Assets**: 
  - Font Awesome (Icon)
  - Google Fonts (Noto Sans KR)

## 📂 프로젝트 구조 (Directory Structure)

```bash
📦 Miso-Busan-Junggu
├── 📄 index.html          # 메인 페이지 (구조 및 콘텐츠)
├── 📂 assets              # 이미지 및 동영상 리소스
│   ├── 📄 mascot_main.png
│   ├── 📄 ceo_portrait.png
│   └── ...
├── 📄 style.css           # 메인 디자인 스타일시트
├── 📄 enhanced-styles.css # 추가 디자인 요소 및 애니메이션
├── 📄 app.js              # 주요 UI 인터랙션 (메뉴, 스크롤 등)
├── 📄 calculator.js       # 대출 계산기 로직
├── 📄 consult.js          # 상담 관련 스크립트
└── 📄 README.md           # 프로젝트 문서
```

## 🚀 로컬 실행 방법 (Local Development)

이 프로젝트는 정적 파일(Static Files)로 구성되어 있어 별도의 서버 설정 없이 바로 실행 가능합니다.

1. **레포지토리 클론 (Clone)**
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **실행 (Run)**
   - `index.html` 파일을 크롬/엣지 등 웹 브라우저로 직접 실행합니다.
   - 또는 VS Code의 'Live Server' 확장 프로그램을 사용하면 실시간 수정 사항을 확인할 수 있습니다.

## 📝 라이선스 및 저작권

Copyright © 2026 (사)미소금융부산중구법인. All Rights Reserved.
본 웹사이트의 콘텐츠(텍스트, 이미지, 로고 등)는 (사)미소금융부산중구법인의 자산이며, 무단 전재 및 재배포를 금지합니다.
