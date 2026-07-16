import prisma from '../config/db.js';

// Helper: build threaded comments tree up to 10 levels deep
function buildCommentTree(commentsList, maxDepth = 10) {
  const map = {};
  const roots = [];
  
  // Initialize map with replies array and clean structure
  commentsList.forEach(c => {
    map[c.id] = { 
      ...c, 
      replies: [] 
    };
  });

  // Helper to trace parent hierarchy and count depth
  function getDepth(commentId) {
    let depth = 0;
    let curr = map[commentId];
    while (curr && curr.parentId) {
      depth++;
      curr = map[curr.parentId];
    }
    return depth;
  }

  commentsList.forEach(c => {
    const depth = getDepth(c.id);
    if (c.parentId && map[c.parentId] && depth <= maxDepth) {
      map[c.parentId].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });

  return roots;
}

// 1. Get Blog Posts (Public / Admin)
export async function getBlogPosts(req, res) {
  const { category, tag, sort, search, page = 1, limit = 9, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Filter conditions
  const where = {};
  
  if (status) {
    where.status = status;
  } else {
    where.status = 'PUBLISHED';
  }

  if (category && category !== 'Semua') {
    where.category = category;
  }

  if (tag) {
    where.tags = {
      contains: tag
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } }
    ];
  }

  // Sorting
  let orderBy = { createdAt: 'desc' };
  if (sort === 'popular') {
    orderBy = { views: 'desc' };
  } else if (sort === 'likes') {
    orderBy = { likes: { _count: 'desc' } };
  } else if (sort === 'comments') {
    orderBy = { comments: { _count: 'desc' } };
  }

  try {
    const [posts, total] = await prisma.$transaction([
      prisma.blogPost.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          author: {
            select: { username: true, role: true }
          },
          memberAuthor: {
            select: { name: true, photoPath: true, role: true }
          },
          _count: {
            select: { comments: true, likes: true }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    return res.json({
      posts: posts.map(p => ({
        ...p,
        authorName: p.author ? p.author.username : (p.memberAuthor ? p.memberAuthor.name : 'Anggota'),
        authorPhoto: p.memberAuthor ? p.memberAuthor.photoPath : null,
        authorRole: p.author ? p.author.role : (p.memberAuthor ? p.memberAuthor.role : 'member'),
        commentCount: p._count.comments,
        likeCount: p._count.likes
      })),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ message: 'Gagal mengambil data postingan blog' });
  }
}

// 2. Get Single Blog Post by Slug
export async function getBlogPostBySlug(req, res) {
  const { slug } = req.params;

  try {
    let post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { username: true, role: true }
        },
        memberAuthor: {
          select: { name: true, photoPath: true, role: true }
        },
        comments: {
          include: {
            member: {
              select: { name: true, photoPath: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        likes: true
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    // Increment views
    post = await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
      include: {
        author: {
          select: { username: true, role: true }
        },
        memberAuthor: {
          select: { name: true, photoPath: true, role: true }
        },
        comments: {
          include: {
            member: {
              select: { name: true, photoPath: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        likes: true
      }
    });

    // Build threaded comments tree
    const threadedComments = buildCommentTree(post.comments);

    return res.json({
      post: {
        ...post,
        authorName: post.author ? post.author.username : (post.memberAuthor ? post.memberAuthor.name : 'Anggota'),
        authorPhoto: post.memberAuthor ? post.memberAuthor.photoPath : null,
        authorRole: post.author ? post.author.role : (post.memberAuthor ? post.memberAuthor.role : 'member'),
        comments: threadedComments,
        likeCount: post.likes.length
      }
    });
  } catch (error) {
    console.error('Error getting single blog post:', error);
    return res.status(500).json({ message: 'Gagal memuat postingan blog' });
  }
}

// Helper: Generate unique slug
async function generateUniqueSlug(title) {
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
    
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${count}`;
    count++;
  }
  return slug;
}

// 3. Create Blog Post
export async function createBlogPost(req, res) {
  const { title, content, category, tags } = req.body;
  const featuredImg = req.file ? `/uploads/photos/${req.file.filename}` : null;

  if (!title || !content) {
    return res.status(400).json({ message: 'Judul dan konten wajib diisi' });
  }

  try {
    const slug = await generateUniqueSlug(title);
    
    let authorId = null;
    let memberId = null;
    let status = 'DRAFT'; // default for members

    if (req.admin) {
      authorId = req.admin.id;
      status = 'PUBLISHED'; // Admins auto-publish
    } else if (req.candidate) {
      memberId = req.candidate.id;
      
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (member && (member.role === 'PEMBINA' || member.role === 'KETUA')) {
        status = 'PUBLISHED';
      }
    } else {
      return res.status(401).json({ message: 'Tidak diizinkan membuat postingan' });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        category: category || 'Umum',
        tags: tags || '',
        status,
        featuredImg,
        authorId,
        memberId
      }
    });

    return res.status(201).json({
      message: status === 'PUBLISHED' ? 'Postingan berhasil dipublikasikan' : 'Postingan berhasil dikirim untuk ditinjau admin',
      post
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ message: 'Gagal membuat postingan blog' });
  }
}

// 4. Update Blog Post
export async function updateBlogPost(req, res) {
  const { id } = req.params;
  const { title, content, category, tags, status } = req.body;
  const featuredImg = req.file ? `/uploads/photos/${req.file.filename}` : undefined;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can edit
    } else if (req.candidate && post.memberId === req.candidate.id) {
      // Member can edit own
    } else {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk mengedit postingan ini' });
    }

    const newStatus = req.admin && status ? status : post.status;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title || post.title,
        content: content || post.content,
        category: category || post.category,
        tags: tags || post.tags,
        status: newStatus,
        featuredImg: featuredImg !== undefined ? featuredImg : post.featuredImg
      }
    });

    return res.json({
      message: 'Postingan berhasil diperbarui',
      post: updated
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({ message: 'Gagal memperbarui postingan blog' });
  }
}

// 5. Delete Blog Post
export async function deleteBlogPost(req, res) {
  const { id } = req.params;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can delete
    } else if (req.candidate && post.memberId === req.candidate.id) {
      // Member can delete own
    } else {
      return res.status(403).json({ message: 'Anda tidak memiliki hak untuk menghapus postingan ini' });
    }

    await prisma.blogPost.delete({ where: { id } });
    return res.json({ message: 'Postingan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({ message: 'Gagal menghapus postingan blog' });
  }
}

// 6. Toggle Like on Blog Post
export async function toggleLikeBlogPost(req, res) {
  const { id } = req.params;
  const { guestId } = req.body; 

  let memberId = req.candidate ? req.candidate.id : null;

  if (!memberId && !guestId) {
    return res.status(400).json({ message: 'User identification (Member or Guest ID) required to like' });
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    let existingLike = null;
    if (memberId) {
      existingLike = await prisma.blogLike.findFirst({
        where: { postId: id, memberId }
      });
    } else {
      existingLike = await prisma.blogLike.findFirst({
        where: { postId: id, guestId }
      });
    }

    if (existingLike) {
      await prisma.blogLike.delete({ where: { id: existingLike.id } });
      const likeCount = await prisma.blogLike.count({ where: { postId: id } });
      return res.json({ liked: false, likeCount });
    } else {
      await prisma.blogLike.create({
        data: {
          postId: id,
          memberId,
          guestId
        }
      });
      const likeCount = await prisma.blogLike.count({ where: { postId: id } });
      return res.json({ liked: true, likeCount });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({ message: 'Gagal menyukai postingan' });
  }
}

// 7. Approve Blog Post Draft (Admin only)
export async function approveBlogPost(req, res) {
  const { id } = req.params;

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    return res.json({ message: 'Postingan berhasil disetujui dan dipublikasikan', post: updated });
  } catch (error) {
    console.error('Error approving post:', error);
    return res.status(500).json({ message: 'Gagal menyetujui postingan' });
  }
}

// 8. Create Blog Comment (Public / Threaded)
export async function createBlogComment(req, res) {
  const { id: postId } = req.params;
  const { content, parentId, username: guestUsername } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Komentar tidak boleh kosong' });
  }

  try {
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ message: 'Postingan blog tidak ditemukan' });
    }

    let memberId = null;
    let username = guestUsername || 'Tamu';

    if (req.candidate) {
      memberId = req.candidate.id;
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (member) {
        username = member.name;
      }
    }

    const comment = await prisma.blogComment.create({
      data: {
        postId,
        content,
        parentId: parentId || null,
        memberId,
        username
      },
      include: {
        member: {
          select: { name: true, photoPath: true, role: true }
        }
      }
    });

    return res.status(201).json({ message: 'Komentar berhasil ditambahkan', comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ message: 'Gagal menambahkan komentar' });
  }
}

// 9. Update Comment
export async function updateBlogComment(req, res) {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const comment = await prisma.blogComment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can update
    } else if (req.candidate && comment.memberId === req.candidate.id) {
      // Member can update own
    } else {
      return res.status(403).json({ message: 'Anda tidak diizinkan mengedit komentar ini' });
    }

    const updated = await prisma.blogComment.update({
      where: { id },
      data: { content },
      include: {
        member: {
          select: { name: true, photoPath: true, role: true }
        }
      }
    });

    return res.json({ message: 'Komentar berhasil diperbarui', comment: updated });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ message: 'Gagal memperbarui komentar' });
  }
}

// 10. Delete Comment
export async function deleteBlogComment(req, res) {
  const { id } = req.params;

  try {
    const comment = await prisma.blogComment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ message: 'Komentar tidak ditemukan' });
    }

    if (req.admin) {
      // Admin can delete
    } else if (req.candidate && comment.memberId === req.candidate.id) {
      // Member can delete own
    } else {
      return res.status(403).json({ message: 'Anda tidak diizinkan menghapus komentar ini' });
    }

    await prisma.blogComment.delete({ where: { id } });
    return res.json({ message: 'Komentar berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ message: 'Gagal menghapus komentar' });
  }
}
