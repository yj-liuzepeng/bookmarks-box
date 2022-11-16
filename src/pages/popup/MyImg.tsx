/*
 * @Author: lzp
 * @Date: 2022-10-29 11:31:27
 * @Description: file content
 */
import { ImgHTMLAttributes } from "react";

/**
 * 图片占位组件属性
 */
export interface IImagProps<T> extends ImgHTMLAttributes<T> {
  /**
   * 加载中的图片
   */
  loadingImg?: string,
  /**
   * 失败加载的图片
   */
  errorImg?: string,
 /**
  * 图片正常显示的地址
  */
  src: string,
}

import React, { useState } from 'react'
export default function Img(props: IImagProps<any>) {
  // 图片地址
  const [src, setSrc] = useState(props.loadingImg as string)
  // 是否第一次加载，如果不使用这个会加载两次
  const [isFlag, setIsFlag] = useState(false)
  /**
   * 图片加载完成
   */
  const handleOnLoad = () => {
    // 判断是否第一次加载
    if (isFlag) return;
    // 创建一个img标签
    const imgDom = new Image();
    imgDom.src = props.src;
    // 图片加载完成使用正常的图片
    imgDom.onload = function () {
      setIsFlag(true)
      setSrc(props.src)
    }
    // 图片加载失败使用图片占位符
    imgDom.onerror = function () {
      setIsFlag(true)
      setSrc(props.errorImg as string)
    }
  }
  
  return (
    <>
      <img src={src}
        onLoad={handleOnLoad}
        style={{
          // height: 'inherit',
        }}
      ></img>
    </>
  )
}
// 设置默认的图片加载中的样式和失败的图片
Img.defaultProps = {
  loadingImg: 'https://liuzepeng.com/web.png',
  errorImg: 'https://liuzepeng.com/web.png'
}