import {commentSelect} from './comment';


export const groupTags = (rows) => {
  rows.forEach((row) => {
    row.tags = [];
    if (row.tag_ids && row.tag_ids.length) {
      row.tag_ids.split(',').forEach((tag_id, i) => {
        row.tags.push({tag_id: tag_id, tag_name: row.tag_names.split(',')[i]});
      });
    }
  });

  return rows;
}


export const articleSelect =
  'SELECT article.article_id, article.author_id, user.name AS author_name, ' +
         'article.date_published, article.title, article.content, ' +
         'GROUP_CONCAT(tag.tag_id) AS tag_ids, ' +
         'GROUP_CONCAT(tag.tag_name) AS tag_names ' +
  'FROM article ' +
    'LEFT JOIN article_tag ON article.article_id = article_tag.article_id ' +
    'LEFT JOIN tag ON tag.tag_id = article_tag.tag_id ' +
    'LEFT JOIN user ON user.user_id = article.author_id ';


class ArticleDB {
  constructor(pool) {
    this.pool = pool;
  }

  getArticles(cb) {
    const sql = articleSelect +
      'GROUP BY article.article_id ' +
      'ORDER BY article.date_published DESC';

    this.pool.query(sql, (err, rows) => {
      if (err) console.error(err);
      cb(err, rows && groupTags(rows));
    });
  }

  getArticle(article_id, cb) {
    const sql = articleSelect +
      'WHERE article.article_id = ? ' +
      'GROUP BY article.article_id';

    this.pool.query(sql, [article_id], (err, rows) => {
      if (err) console.error(err);
      cb(err, rows && groupTags(rows)[0]);
    });
  }

  getCommentsByArticle(article_id, cb) {
    const sql = commentSelect +
      'WHERE comment.article_id = ? ' +
      'ORDER BY comment.date_published DESC';

    this.pool.query(sql, [article_id], (err, rows) => {
      if (err) console.error(err);
      cb(err, rows);
    });
  }

  createArticle(article, cb) {
    const sql =
      'INSERT INTO article ' +
      'SET author_id = ?, title = ?, content = ?';

    this.pool.query(sql, [article.author_id, article.title, article.content], (err, rows) => {
      if (err) console.error(err);
      cb(err, rows && rows.insertId);
    });
  }

  updateArticle(article_id, article, cb) {
    const sql =
      'UPDATE article ' +
      'SET title = ?, content = ? ' +
      'WHERE article_id = ?';

    this.pool.query(sql, [article.title, article.content, article_id], (err, rows) => {
      if (err) console.error(err);
      cb(err, rows && rows.affectedRows);
    });
  }

  deleteArticle(article_id, cb) {
    const sql =
      'DELETE FROM article ' +
      'WHERE article_id = ?';

    this.pool.query(sql, [article_id], (err, rows) => {
      if (err) console.error(err);
      cb(err, rows && rows.affectedRows);
    });
  }

  removeTags(article_id, cb) {
    const sql =
      'DELETE FROM article_tag ' +
      'WHERE article_id = ?';

    this.pool.query(sql, [article_id], (err, rows) => {
      if (err) console.error(err);
      cb();
    });
  }

  tagArticle(article_id, tag_name) {
    const sql =
      'CALL tag_article(?, ?)';

    this.pool.query(sql, [article_id, tag_name], (err, rows) => {
      if (err) console.error(err);
    });
  }
}


export default ArticleDB;
