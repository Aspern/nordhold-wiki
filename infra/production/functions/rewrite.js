function handler(event) {
  var request = event.request;
  var method = request.method;
  var uri = request.uri;

  if (method !== "GET" && method !== "HEAD") {
    return request;
  }

  if (uri === "/") {
    request.uri = "/index.html";
    return request;
  }

  if (uri.indexOf("/assets/") === 0) {
    return request;
  }

  var finalSegment = uri.substring(uri.lastIndexOf("/") + 1);
  if (finalSegment.indexOf(".") !== -1) {
    return request;
  }

  request.uri = "/index.html";
  return request;
}
