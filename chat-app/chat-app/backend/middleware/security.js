// SQL注入防护中间件
const sqlInjectionGuard = (req, res, next) => {
  const sqlKeywords = [
    'SELECT', 'INSERT', 'DELETE', 'UPDATE', 'DROP', 'UNION', 
    'TRUNCATE', 'ALTER', 'CREATE', 'EXEC', 'OR', 'AND', ';', '--'
  ];
  
  const regex = new RegExp(sqlKeywords.join('|'), 'gi');
  
  // 检查查询参数
  Object.keys(req.query).forEach(key => {
    if (regex.test(req.query[key])) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }
  });
  
  // 检查请求体
  if (req.body) {
    const bodyString = JSON.stringify(req.body);
    if (regex.test(bodyString)) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }
  }
  
  next();
};

// XSS防护中间件
const xssGuard = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<[^>]*>/g, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitize(obj[key]);
        return acc;
      }, {});
    }
    
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

module.exports = {
  sqlInjectionGuard,
  xssGuard
};