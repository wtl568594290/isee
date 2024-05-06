import prisma from './conn'

async function createBook(name: string, total: number) {
  // 判断是否存在
  const book = await prisma.book.findFirst({
    where: {
      name: {
        equals: name,
      },
    },
  })
  if (book) {
    const lastLine = book.total === total ? book.lastLine : 0
    return await prisma.book.update({
      where: {
        id: book.id,
      },
      data: {
        name,
        total,
        lastLine,
      },
    })
  } else {
    return await prisma.book.create({
      data: {
        name,
        total,
        lastLine: 0,
      },
    })
  }
}

async function deleteBook(id: number) {
  return await prisma.book.delete({
    where: {
      id,
    },
  })
}

async function updateHistory(id: number, lastLine: number) {
  return await prisma.book.update({
    where: {
      id,
    },
    data: {
      lastLine,
    },
  })
}

async function getBook(id: number) {
  return await prisma.book.findFirst({
    where: {
      id,
    },
  })
}

/** 按更新时间排序 */
async function getBooks() {
  return await prisma.book.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  })
}

async function getBooksByName(name: string, page: number, pageSize: number) {
  const books = await prisma.book.findMany({
    where: {
      name: {
        contains: name,
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: {
      updatedAt: 'desc',
    },
  })
  const total = await prisma.book.count({
    where: {
      name: {
        contains: name,
      },
    },
  })
  return {
    data: books,
    total,
  }
}

async function clearBooks() {
  return await prisma.book.deleteMany()
}

export {
  createBook,
  deleteBook,
  updateHistory,
  getBook,
  getBooks,
  getBooksByName,
  clearBooks,
}
