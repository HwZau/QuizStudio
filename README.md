# Assignment 4 Full-stack Quiz Application

Ứng dụng quiz dùng Node.js, Express, MongoDB, Mongoose và React, Redux Toolkit, React Router, Bootstrap 5. Giao diện được dựng lại theo ảnh trong đề: Login nền trắng, Dashboard theo quyền, làm từng câu và quản lý câu hỏi với bốn ô đáp án riêng.

## Chạy bản demo theo đề

Yêu cầu Node.js 20+ và MongoDB ở `mongodb://127.0.0.1:27017`.

```powershell
npm install
# Khi chuyển sang máy khác, copy server/.env.example thành server/.env
# và đặt JWT_SECRET riêng trước khi chạy.
npm run demo
npm run dev
```

Mở [http://localhost:3001](http://localhost:3001). API chạy ở cổng 4000; Vite chuyển request `/api` sang backend.

| Tài khoản | Mật khẩu demo | Quyền |
| --- | --- | --- |
| John | John12345! | Người dùng làm quiz, đọc bài viết |
| Mary | Mary12345! | Admin quản lý câu hỏi, quiz và bài viết |

Đây là tài khoản demo local. Script `npm run demo` không ghi đè mật khẩu tài khoản đã có. Có thể đặt `DEMO_ADMIN_USERNAME`, `DEMO_ADMIN_PASSWORD`, `DEMO_LEARNER_USERNAME`, `DEMO_LEARNER_PASSWORD` trước khi chạy để thay giá trị mặc định.

Database demo là `SimpleQuizAssignment4Reference`, có một quiz với đúng năm câu trong ảnh, theo thứ tự: thuyết tương đối, ký hiệu sắt, thủ đô Pháp, Anh và Đức. Dữ liệu trước đây trong database `SimpleQuizFullstack` vẫn được giữ. Để dùng lại, đổi `MONGODB_DB` trong `server/.env` rồi khởi động lại backend.

Để tự tạo tài khoản admin và nạp câu hỏi mẫu:

```powershell
$env:ADMIN_USERNAME='your-admin'
$env:ADMIN_PASSWORD='your-strong-password'
npm run create-admin --workspace server
npm run seed --workspace server
Remove-Item Env:ADMIN_PASSWORD
```

## Màn hình và luồng sử dụng

| Đường dẫn | Nội dung |
| --- | --- |
| `/login` | Login với Username, Password, nút Login và liên kết Register |
| `/register` | Tạo tài khoản người dùng thường |
| `/dashboard` | Dashboard, lời chào, menu Home / Quiz / Article / Logout |
| `/dashboard/quiz` | Tự mở quiz nếu có một quiz; hiển thị danh sách nếu có nhiều quiz |
| `/dashboard/quiz/:quizId` | Mở một quiz cụ thể |
| `/dashboard/articles` | Đọc bài viết |
| `/admin` | Admin Dashboard, menu Home / Manage Questions / Manage Articles / Logout |
| `/admin/questions` | CRUD câu hỏi, bốn ô Options, Correct Answer Index bắt đầu từ 0 |
| `/admin/articles` | CRUD bài viết gồm Title và Content |
| `/admin/quizzes` | CRUD quiz, gán câu hỏi vào quiz |

Admin đăng nhập được chuyển tới `/admin`; người dùng thường tới `/dashboard`. Màn hình Home giữ bố cục trống dưới thanh menu giống ảnh mẫu. Trang quản lý quiz có đường dẫn riêng để giữ nguyên menu mẫu.

Khi làm quiz, mỗi lần chỉ hiển thị một câu với bốn lựa chọn radio. Chọn một đáp án rồi nhấn **Submit Answer** để sang câu tiếp theo. Sau câu cuối, server chấm điểm; giao diện hiển thị **Quiz Completed**, **Your score: …**, **Restart Quiz**. Làm lại xóa các lựa chọn và đưa về câu đầu.

Redux quản lý xác thực, quiz và tiến độ làm bài, danh sách câu hỏi, danh sách bài viết cùng trạng thái tải/lỗi. Đăng xuất xóa token và dữ liệu trong Redux. Chỉ người dùng đã đăng nhập mới được tải dữ liệu.

Article/Manage Articles có trong menu ảnh mẫu nhưng đề không quy định nội dung chi tiết; phần CRUD bài viết cơ bản được bổ sung theo yêu cầu.

## API

Gửi `Content-Type: application/json` khi có JSON body. Các route cần đăng nhập dùng `Authorization: Bearer <token>`.

| Method | Route | Quyền |
| --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Công khai |
| GET | `/api/auth/me` | Đăng nhập |
| GET / POST | `/api/users` | Admin: xem danh sách / tạo tài khoản |
| GET | `/api/quizzes`, `/api/quizzes/:quizId` | Đăng nhập |
| POST | `/api/quizzes/:quizId/submit` | Đăng nhập |
| POST | `/api/quizzes` | Admin |
| PUT / DELETE | `/api/quizzes/:quizId` | Admin |
| GET / POST | `/api/questions` | Admin |
| GET / PUT / DELETE | `/api/questions/:questionId` | Admin |
| GET | `/api/articles`, `/api/articles/:articleId` | Đăng nhập |
| POST | `/api/articles` | Admin |
| PUT / DELETE | `/api/articles/:articleId` | Admin |

Các route cũ `/api/users/signup`, `/api/users/login` và `/api/question` vẫn được hỗ trợ.

Tạo admin qua Postman: gửi `POST /api/auth/register` (hoặc `/api/users/signup`) với Authorization là **No Auth**, Content-Type là `application/json` và JSON body:

```json
{
  "username": "adminnew",
  "password": "your-new-admin-password",
  "admin": true
}
```

API trả `201` với `{ "user": { "_id": "...", "username": "adminnew", "admin": true }, "token": "..." }`. Dùng ngay token này để gọi API quản trị, không cần đăng nhập trước khi đăng ký. Bỏ `admin` hoặc gửi `false` để tạo user thường; giá trị không phải boolean (ví dụ `"true"`) trả `400`. Username trùng (kể cả khác hoa/thường) trả `409` và không thay đổi quyền hay mật khẩu của tài khoản đã có. Theo cấu hình bài tập được yêu cầu, bất kỳ ai gọi API đăng ký cũng có thể tự tạo admin bằng `admin: true`.

`POST /api/users` vẫn là API tạo tài khoản dành cho admin đã đăng nhập, trả `{ "user": { ... } }` và không cấp token của tài khoản mới. API này yêu cầu Bearer token; thiếu token trả `401`, user thường trả `403`. Script `create-admin` vẫn có thể dùng để tạo hoặc cập nhật tài khoản admin từ terminal.

| Thao tác | JSON body |
| --- | --- |
| Đăng ký / đăng nhập | `{ "username": "John", "password": "John12345!" }` |
| Tạo câu hỏi | `{ "text": "Question?", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0 }` |
| Tạo quiz | `{ "title": "Quiz", "description": "Description", "questions": ["<questionId>"] }` |
| Nộp bài | `{ "answers": { "<questionId>": 0 } }` |
| Tạo bài viết | `{ "title": "Title", "content": "Article content" }` |

Đăng ký/đăng nhập trả `{ user, token }`; đăng ký nhận trường `admin` kiểu boolean và mặc định là `false`. Form Register trên giao diện không gửi trường này nên vẫn tạo user thường. Username không phân biệt chữ hoa/thường: `John`, `john` và `JOHN` là cùng một tài khoản; đăng ký tên chỉ khác hoa/thường trả 409. Giao diện vẫn hiển thị cách viết username đã lưu. Quy tắc này cũng áp dụng cho script tạo admin và dữ liệu demo. Mật khẩu được băm bằng bcrypt và vẫn phân biệt chữ hoa/thường. Quiz của người dùng thường không chứa `correctAnswerIndex`; server trả `score`, `total` và `review` sau khi nộp.

Bài viết yêu cầu title dạng chuỗi không rỗng, tối đa 200 ký tự, content dạng chuỗi không rỗng. Author lấy từ tài khoản đăng nhập. PUT cho phép cập nhật một hoặc cả hai trường; GET danh sách trả mảng sắp theo thời gian tạo. POST trả 201; GET/PUT trả 200; DELETE trả 204 không có body.

Lỗi API có dạng `{ "error": "..." }`: 400 cho dữ liệu hoặc ID không hợp lệ, 401 khi thiếu/sai token hoặc sai thông tin đăng nhập, 403 khi thiếu quyền admin, 404 khi tài nguyên không tồn tại, 409 khi trùng username. Lỗi không dự kiến trả 500.

## Build và kiểm thử

```powershell
npm test
npx playwright install chromium
npm run test:e2e
npm start
```

`npm test` chạy kiểm thử tích hợp API và build frontend. `npm run test:e2e` build rồi chạy sáu kiểm thử Chromium: đăng ký/đăng nhập/đăng xuất, quiz từng câu và làm lại, phân quyền, CRUD câu hỏi, CRUD quiz, CRUD bài viết và bố cục mobile. Hai bộ kiểm thử dùng database tạm riêng và xóa sau khi chạy; ảnh chụp nằm trong `test-results/`.

Sau khi build, `npm start` phục vụ cả frontend và API tại [http://localhost:4000](http://localhost:4000).

## Chuẩn bị deploy từ GitHub

Repository: [HwZau/QuizStudio](https://github.com/HwZau/QuizStudio). Thư mục Assignment 4 là Git repository độc lập; source frontend và backend cùng nằm tại root của repo.

Triển khai dưới dạng một Node.js web service với cấu hình:

| Cấu hình | Giá trị |
| --- | --- |
| Root directory | Root của repository |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Node.js | 22.12+ |

Thiết lập biến môi trường trên dịch vụ hosting:

| Biến | Nội dung |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Connection string của MongoDB có thể truy cập từ hosting |
| `MONGODB_DB` | Tên database muốn sử dụng |
| `JWT_SECRET` | Secret riêng cho môi trường deploy |
| `PORT` | Dùng cổng do hosting cung cấp; mặc định local là 4000 |

Express phục vụ frontend đã build và API trên cùng domain. Frontend gọi `/api` nên không cần cấu hình URL API riêng. Database MongoDB local và tài khoản local không được chuyển lên hosting qua Git; tạo admin trên database deploy bằng script `create-admin` sau khi cấu hình môi trường. Script `demo` dành cho dữ liệu minh họa local.

File `.env`, `node_modules`, bản build và kết quả kiểm thử được bỏ qua khi commit. Repo chỉ có `server/.env.example` làm mẫu cấu hình.
