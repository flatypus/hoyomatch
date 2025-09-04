#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

#define MAX_BIT_ERROR 2
#define MAX_ALIGN_OFFSET 120

int _popcount(uint32_t x)
{
    int count = 0;
    while (x)
    {
        x &= x - 1;
        count++;
    }
    return count;
}

int find_max(int *arr, int size)
{
    int max = arr[0];
    for (int i = 1; i < size; i++)
    {
        if (arr[i] > max)
        {
            max = arr[i];
        }
    }
    return max;
}

int min(int a, int b)
{
    return (a < b) ? a : b;
}

int max(int a, int b)
{
    return (a > b) ? a : b;
}

double compute_similarity(uint32_t *a, int asize, uint32_t *b, int bsize)
{
    int numcounts = asize + bsize + 1;
    int *counts = calloc(numcounts, sizeof(int));

    if (!counts)
    {
        printf("Memory allocation failed\n");
        return -1.0;
    }

    for (int i = 0; i < asize; i++)
    {
        int jbegin = max(0, i - MAX_ALIGN_OFFSET);
        int jend = min(bsize, i + MAX_ALIGN_OFFSET);

        for (int j = jbegin; j < jend; j++)
        {
            int biterror = _popcount(a[i] ^ b[j]);
            if (biterror <= MAX_BIT_ERROR)
            {
                int offset = i - j + bsize;
                counts[offset] += 1;
            }
        }
    }

    int topcount = find_max(counts, numcounts);
    double similarity = (double)topcount / (double)min(asize, bsize);

    free(counts);
    return similarity;
}

// Convert raw bytes to uint32 array (little-endian)
int bytesToUint32Array(unsigned char *bytes, int byte_length, uint32_t *output, int max_length)
{
    int num_uint32 = byte_length / 4;
    if (num_uint32 > max_length)
        num_uint32 = max_length;

    for (int i = 0; i < num_uint32; i++)
    {
        int offset = i * 4;
        output[i] = (uint32_t)bytes[offset] |
                    ((uint32_t)bytes[offset + 1] << 8) |
                    ((uint32_t)bytes[offset + 2] << 16) |
                    ((uint32_t)bytes[offset + 3] << 24);
    }

    return num_uint32;
}