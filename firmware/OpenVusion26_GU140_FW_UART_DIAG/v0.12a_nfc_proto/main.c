#include <cc2510fx.h>
#include <stdint.h>

#include "board.h"
#include "clock.h"
#include "uart1.h"

/*
 * EXP-066 / v0.12a — OVMB v1 mailbox parser, no EPD.
 * I2C SRAM only after RF field off (FD high). --nooverlay.
 */

#define IMAGE_LEN   11248u
#define PAYLOAD_MAX 48u
#define SRAM0       0xF8u

#define FT_BEGIN  1u
#define FT_DATA   2u
#define FT_COMMIT 3u
#define FT_ABORT  4u
#define FT_ACK    5u

#define ST_READY    0u
#define ST_TRANSFER 1u
#define ST_VERIFIED 2u
#define ST_REFRESH  3u
#define ST_DONE     4u
#define ST_ABORT    5u
#define ST_ERROR    6u

#define ER_OK        0u
#define ER_BAD_VER   2u
#define ER_BAD_CRC   3u
#define ER_BAD_SEQ   4u
#define ER_BAD_OFF   5u
#define ER_BAD_LEN   6u
#define ER_BAD_FMT   7u
#define ER_PREMATURE 8u
#define ER_BAD_E2E   9u
#define ER_TIMEOUT   10u
#define ER_ABORTED   11u
#define ER_BAD_TYPE  12u

static __xdata uint8_t frame[64];
static uint8_t st;
static uint8_t er;
static uint8_t xfer;
static uint8_t last_seq;
static uint16_t got;
static uint32_t e2e;
static uint8_t last_type;
static uint8_t last_xid;
static uint8_t last_hseq;
static uint16_t last_hoff;
static uint8_t have_last;
static uint16_t idle_n;

static volatile uint16_t dly_b;

static void i2c_pause(void)
{
    dly_b = 80u;
    while (dly_b != 0u) {
        __asm
            nop
        __endasm;
        dly_b--;
    }
}

static void sda_low(void)
{
    NFC_SDA = 0;
    P0DIR |= BV(4);
}

static void sda_release(void)
{
    P0DIR &= (unsigned char)~BV(4);
}

static void scl_low(void)
{
    NFC_SCL = 0;
    P0DIR |= BV(6);
}

static void scl_release(void)
{
    uint8_t n;

    P0DIR &= (unsigned char)~BV(6);
    n = 0u;
    while ((NFC_SCL == 0) && (n < 255u)) {
        n++;
    }
}

static void i2c_start(void)
{
    sda_release();
    scl_release();
    i2c_pause();
    sda_low();
    i2c_pause();
    scl_low();
}

static void i2c_stop(void)
{
    sda_low();
    i2c_pause();
    scl_release();
    i2c_pause();
    sda_release();
    i2c_pause();
}

static uint8_t i2c_write(uint8_t value)
{
    uint8_t i;
    uint8_t ack;

    for (i = 0u; i < 8u; ++i) {
        if (value & 0x80u) {
            sda_release();
        } else {
            sda_low();
        }
        i2c_pause();
        scl_release();
        i2c_pause();
        scl_low();
        value <<= 1;
    }
    sda_release();
    i2c_pause();
    scl_release();
    i2c_pause();
    ack = NFC_SDA ? 0u : 1u;
    scl_low();
    i2c_pause();
    return ack;
}

static uint8_t i2c_read(uint8_t send_ack)
{
    uint8_t i;
    uint8_t value;

    value = 0u;
    sda_release();
    for (i = 0u; i < 8u; ++i) {
        value <<= 1;
        i2c_pause();
        scl_release();
        i2c_pause();
        if (NFC_SDA) {
            value |= 1u;
        }
        scl_low();
    }
    if (send_ack) {
        sda_low();
    } else {
        sda_release();
    }
    i2c_pause();
    scl_release();
    i2c_pause();
    scl_low();
    sda_release();
    i2c_pause();
    return value;
}

static uint8_t field_on(void)
{
    return (uint8_t)(NFC_FD == 0);
}

static uint16_t crc16_update(uint16_t crc, uint8_t b)
{
    uint8_t i;

    crc ^= (uint16_t)b << 8;
    for (i = 0u; i < 8u; ++i) {
        if (crc & 0x8000u) {
            crc = (uint16_t)((crc << 1) ^ 0x1021u);
        } else {
            crc = (uint16_t)(crc << 1);
        }
    }
    return crc;
}

static uint16_t crc16_frame(void)
{
    uint16_t crc;
    uint8_t i;
    uint8_t plen;

    plen = frame[10];
    crc = 0xFFFFu;
    for (i = 0u; i < 14u; ++i) {
        crc = crc16_update(crc, frame[i]);
    }
    for (i = 0u; i < plen; ++i) {
        crc = crc16_update(crc, frame[16u + i]);
    }
    return crc;
}

static uint32_t crc32_update(uint32_t crc, uint8_t b)
{
    uint8_t i;

    crc ^= b;
    for (i = 0u; i < 8u; ++i) {
        if (crc & 1u) {
            crc = (crc >> 1) ^ 0xEDB88320ul;
        } else {
            crc >>= 1;
        }
    }
    return crc;
}

static uint8_t i2c_rw16(uint8_t blk, uint8_t wr)
{
    uint8_t i;
    uint8_t ack;
    __xdata uint8_t *p;

    p = &frame[(uint8_t)((blk - SRAM0) * 16u)];
    i2c_start();
    ack = i2c_write(0xAAu);
    ack = (uint8_t)(ack && i2c_write(blk));
    if (!wr) {
        i2c_start();
        ack = (uint8_t)(ack && i2c_write(0xABu));
        for (i = 0u; i < 16u; ++i) {
            p[i] = i2c_read(1u);
        }
    } else {
        for (i = 0u; i < 16u; ++i) {
            ack = (uint8_t)(ack && i2c_write(p[i]));
        }
    }
    i2c_stop();
    return ack;
}

static void sram_read(void)
{
    (void)i2c_rw16(0xF8u, 0u);
    (void)i2c_rw16(0xF9u, 0u);
    (void)i2c_rw16(0xFAu, 0u);
    (void)i2c_rw16(0xFBu, 0u);
}

static void sram_write(void)
{
    (void)i2c_rw16(0xF8u, 1u);
    (void)i2c_rw16(0xF9u, 1u);
    (void)i2c_rw16(0xFAu, 1u);
    (void)i2c_rw16(0xFBu, 1u);
}

static void uart_state(void)
{
    if (st == ST_READY) {
        uart_puts("READY");
    } else if (st == ST_TRANSFER) {
        uart_puts("TRANSFER");
    } else if (st == ST_VERIFIED) {
        uart_puts("VERIFIED");
    } else if (st == ST_REFRESH) {
        uart_puts("REFRESH");
    } else if (st == ST_DONE) {
        uart_puts("DONE");
    } else if (st == ST_ABORT) {
        uart_puts("ABORT");
    } else {
        uart_puts("ERROR");
    }
    uart_puts(" ER=");
    uart_hex8(er);
    uart_puts(" GOT=");
    uart_hex8((uint8_t)(got >> 8));
    uart_hex8((uint8_t)got);
    uart_crlf();
}

static void write_ack(void)
{
    uint8_t i;
    uint16_t crc;

    frame[0] = 'O';
    frame[1] = 'V';
    frame[2] = 'M';
    frame[3] = 'B';
    frame[4] = 0x01u;
    frame[5] = FT_ACK;
    frame[6] = xfer;
    frame[7] = last_seq;
    frame[8] = (uint8_t)got;
    frame[9] = (uint8_t)(got >> 8);
    frame[10] = 4u;
    frame[11] = 0xF0u;
    frame[12] = 0x2Bu;
    frame[13] = 0xB1u;
    frame[16] = st;
    frame[17] = er;
    frame[18] = (uint8_t)got;
    frame[19] = (uint8_t)(got >> 8);
    for (i = 20u; i < 64u; ++i) {
        frame[i] = 0u;
    }
    crc = crc16_frame();
    frame[14] = (uint8_t)crc;
    frame[15] = (uint8_t)(crc >> 8);
    sram_write();
}

static void fail(uint8_t e)
{
    st = ST_ERROR;
    er = e;
}

static void handle(void)
{
    uint8_t typ;
    uint8_t xid;
    uint8_t seq;
    uint8_t plen;
    uint16_t off;
    uint16_t total;
    uint16_t crc;
    uint16_t gotcrc;
    uint8_t i;
    uint32_t want;

    if (frame[0] != 'O' || frame[1] != 'V' || frame[2] != 'M' || frame[3] != 'B') {
        return;
    }
    typ = frame[5];
    if (typ == FT_ACK) {
        return;
    }
    plen = frame[10];
    if (plen > PAYLOAD_MAX) {
        fail(ER_BAD_LEN);
        return;
    }
    crc = crc16_frame();
    gotcrc = (uint16_t)frame[14] | ((uint16_t)frame[15] << 8);
    if (crc != gotcrc) {
        fail(ER_BAD_CRC);
        return;
    }
    xid = frame[6];
    seq = frame[7];
    off = (uint16_t)frame[8] | ((uint16_t)frame[9] << 8);
    total = (uint16_t)frame[11] | ((uint16_t)frame[12] << 8);
    if (have_last && typ == FT_DATA && typ == last_type && xid == last_xid &&
        seq == last_hseq && off == last_hoff) {
        return;
    }
    idle_n = 0u;
    last_type = typ;
    last_xid = xid;
    last_hseq = seq;
    last_hoff = off;
    have_last = 1u;

    if (frame[4] != 0x01u) {
        fail(ER_BAD_VER);
        return;
    }
    if (typ == FT_ABORT) {
        st = ST_ABORT;
        er = ER_ABORTED;
        got = 0u;
        e2e = 0u;
        return;
    }
    if (typ == FT_BEGIN) {
        if (total != IMAGE_LEN || frame[13] != 0xB1u || off != 0u || seq != 0u) {
            fail((total != IMAGE_LEN) ? ER_BAD_LEN : ER_BAD_FMT);
            return;
        }
        xfer = xid;
        last_seq = 0u;
        got = 0u;
        e2e = 0xFFFFFFFFul;
        er = ER_OK;
        st = ST_TRANSFER;
        have_last = 1u;
        return;
    }
    if (st != ST_TRANSFER) {
        fail(ER_BAD_TYPE);
        return;
    }
    if (xid != xfer) {
        fail(ER_BAD_SEQ);
        return;
    }
    if (typ == FT_DATA) {
        if (seq != (uint8_t)(last_seq + 1u)) {
            fail(ER_BAD_SEQ);
            return;
        }
        if (off != got || plen == 0u || (uint16_t)(off + plen) > IMAGE_LEN) {
            fail((off != got) ? ER_BAD_OFF : ER_BAD_LEN);
            return;
        }
        for (i = 0u; i < plen; ++i) {
            e2e = crc32_update(e2e, frame[16u + i]);
        }
        got = (uint16_t)(got + plen);
        last_seq = seq;
        return;
    }
    if (typ == FT_COMMIT) {
        if (got != IMAGE_LEN) {
            fail(ER_PREMATURE);
            return;
        }
        if (plen != 4u) {
            fail(ER_BAD_LEN);
            return;
        }
        want = (uint32_t)frame[16] | ((uint32_t)frame[17] << 8) |
               ((uint32_t)frame[18] << 16) | ((uint32_t)frame[19] << 24);
        e2e ^= 0xFFFFFFFFul;
        if (want != e2e) {
            fail(ER_BAD_E2E);
            return;
        }
        last_seq = seq;
        er = ER_OK;
        st = ST_VERIFIED;
        st = ST_DONE;
        return;
    }
    fail(ER_BAD_TYPE);
}

static void process(void)
{
    uint8_t prev;

    prev = st;
    sram_read();
    handle();
    write_ack();
    if (st != prev) {
        uart_state();
    }
}

void main(void)
{
    uint8_t saw;
    uint8_t reset_cause;

    reset_cause = (uint8_t)((SLEEP >> 3) & 0x03u);
    clock_init_26mhz();
    uart1_init_115200_alt2_tx_p16();

    P0SEL &= (unsigned char)~(BV(4) | BV(6));
    P0INP |= (uint8_t)(BV(4) | BV(6));
    sda_release();
    scl_release();
    P1SEL &= (unsigned char)~BV(1);
    P1DIR &= (unsigned char)~BV(1);

    st = ST_READY;
    er = ER_OK;
    got = 0u;
    e2e = 0u;
    have_last = 0u;
    idle_n = 0u;
    saw = 0u;

    uart_crlf();
    uart_puts("OpenVusion GU140 EXP-066 v0.12a OVMB");
    uart_crlf();
    uart_puts("RESET_CAUSE=");
    uart_hex8(reset_cause);
    uart_crlf();
    uart_state();

    while (1) {
        if (field_on()) {
            saw = 1u;
        } else if (saw) {
            saw = 0u;
            idle_n = 0u;
            process();
        }
    }
}
