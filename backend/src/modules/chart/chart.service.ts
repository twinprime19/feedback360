/**
 * @file Chart service
 * @module module/chart/service
 */

import { Injectable } from "@nestjs/common";
import axios from "axios";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class ChartService {
  constructor() {}

  async getLineChart(
    titleChart: string,
    labels: string[],
    values: number[],
    min: number,
    max: number
  ) {
    const directory = "./assets/uploads/chart";
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    // let labels = [
    //   "Xây dựng mục tiêu và định hướng thực hiện",
    //   "Ra quyết định và giải quyết vấn đề",
    //   "Giao tiếp",
    //   "Động lực và sự gắn kết",
    //   "Tạo cơ hội phát triển",
    //   "Đạo đức và liêm chính",
    //   "Cách tiếp cận vấn đề xung đột",
    //   "Công bằng, vô tư",
    //   "Giao tiếp trong tình huống xung đột",
    //   "Giải quyết vấn đề và hòa giải",
    //   "Tác động lâu dài",
    // ];

    // let values = [3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3];

    // Thêm dấu ba chấm nếu độ dài lớn hơn 30 ký tự
    const formattedLabels = labels.map((label) => {
      if (label.length > 20) {
        return label.slice(0, 20) + "..."; // Cắt chuỗi và thêm dấu "..."
      }
      return label;
    });

    const chartConfig = {
      type: "line",
      data: {
        labels: formattedLabels,
        datasets: [
          {
            label: "Điểm số",
            data: values,
            borderColor: "blue",
            fill: false,
          },
        ],
      },
      options: {
        title: {
          display: true,
          text: titleChart,
          fontSize: 12, // Kích thước font cho tiêu đề
          fontColor: "#333333", // Màu cho tiêu đề
        },
        scales: {
          xAxes: [
            {
              ticks: {
                minRotation: 45, // Xoay labels 90 độ
                maxRotation: 45,
                fontSize: 10, // Cỡ chữ cho các label trục x
                fontFamily: "Arial", // Font chữ cho các label trục x
                fontColor: "#333333", // Màu chữ cho các label trục x
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                min: min,
                max: max,
                stepSize: 1,
                fontSize: 10, // Cỡ chữ cho các label trục y
                fontFamily: "Arial", // Font chữ cho các label trục y
                fontColor: "#333333", // Màu chữ cho các label trục y
              },
            },
          ],
        },
      },
    };

    const quickChartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(
      JSON.stringify(chartConfig)
    )}`;

    return quickChartUrl;
  }

  async getMultiLineChart(chartConfig: any) {
    const directory = "./assets/uploads/chart";
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    const response = await axios.post("https://quickchart.io/chart/create", {
      chart: chartConfig,
      // width: 600,
      // height: 400,
      format: "jpeg", // Đặt định dạng ảnh là JPEG, mặc định là PNG
    });

    // Tải xuống hình ảnh từ URL mà QuickChart trả về
    const imageUrl = response.data.url;

    return imageUrl;
  }
}
