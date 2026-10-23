FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/server/main.go

# Runtime Stage
FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Jakarta

RUN mkdir -p /app/storage/uploads

COPY --from=builder /app/server .

EXPOSE 8080

CMD ["./server"]
