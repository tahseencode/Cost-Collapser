import { app } from '../src/server.js';

export default function handler(req, res) {
  return app(req, res);
}
